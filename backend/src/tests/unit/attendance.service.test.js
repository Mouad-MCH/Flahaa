import { describe, it, expect, vi, beforeEach } from 'vitest';
import Attendance from '../../models/Attendance.js';
import Worker from '../../models/Worker.js';
import {
  createAttendanceService,
  bulkCreateAttendanceService,
  getAttendanceByDateService,
  getWorkerAttendanceService,
  getMonthlySummaryService,
} from '../../services/attendance.service.js';

vi.mock('../../models/Attendance.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../../models/Worker.js', () => ({
  default: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));


const queryMock = (resolvedValue) => {
  const query = {
    select: vi.fn(() => query),
    populate: vi.fn(() => query),
    sort: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return query;
};

const admin = { _id: 'admin-1', role: 'admin' };
const supervisorA = { _id: 'sup-a', role: 'supervisor' };
const supervisorB = { _id: 'sup-b', role: 'supervisor' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAttendanceService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when the worker does not exist on the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(
      createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, admin)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Attendance.create).not.toHaveBeenCalled();
  });

  it('scopes the worker lookup to the farm for an admin', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, admin);

    expect(Worker.findOne).toHaveBeenCalledWith({ farm_id: farmId, _id: 'w1' });
  });

  it('scopes the worker lookup to the farm and the supervisor for a supervisor', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, supervisorA);

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorA._id,
      _id: 'w1',
    });
  });

  it('supervisor cannot create attendance for another supervisor\'s worker', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(
      createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, supervisorB)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorB._id,
      _id: 'w1',
    });
    expect(Attendance.create).not.toHaveBeenCalled();
  });

  it('throws a 400 when attendance already recorded for that worker/date', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock({ _id: 'existing' }));

    await expect(
      createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, admin)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Attendance already recorded for this worker on this date',
    });

    expect(Attendance.create).not.toHaveBeenCalled();
  });

  it('normalizes the date to UTC midnight, defaults check_in/check_out, and records the requesting user', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18', status: 'present' }, admin);

    expect(Attendance.create).toHaveBeenCalledWith({
      worker_id: 'w1',
      farm_id: farmId,
      date: new Date('2026-08-18T00:00:00.000Z'),
      status: 'present',
      check_in: undefined,
      check_out: undefined,
      recorded_by: admin._id,
    });
  });

  it('converts check_in and check_out to Dates when provided', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(
      farmId,
      {
        worker_id: 'w1',
        date: '2026-08-18',
        status: 'present',
        check_in: '2026-08-18T08:00:00.000Z',
        check_out: '2026-08-18T17:00:00.000Z',
      },
      admin
    );

    expect(Attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        check_in: new Date('2026-08-18T08:00:00.000Z'),
        check_out: new Date('2026-08-18T17:00:00.000Z'),
      })
    );
  });

  it('scopes the existing-record lookup to farm_id, worker_id and normalized date', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, admin);

    expect(Attendance.findOne).toHaveBeenCalledWith({
      worker_id: 'w1',
      date: new Date('2026-08-18T00:00:00.000Z'),
      farm_id: farmId,
    });
  });
});

describe('bulkCreateAttendanceService', () => {
  const farmId = 'farm-1';

  it('reports unknown workers as errors without touching Attendance', async () => {
    Worker.find.mockResolvedValueOnce([]);

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'missing' }] },
      admin
    );

    expect(result).toEqual({
      recorded: 0,
      failed: 1,
      results: [],
      errors: [{ worker_id: 'missing', message: 'Worker not found or not accessible' }],
    });
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('scopes the valid-workers lookup to the farm for an admin', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1', name: 'John' }]);
    Attendance.findOneAndUpdate.mockResolvedValueOnce({ _id: 'a1', worker_id: 'w1', status: 'present' });

    await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1' }] },
      admin
    );

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: farmId, _id: { $in: ['w1'] } });
  });

  it('accepts workers belonging to the requesting supervisor', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1', name: 'John' }]);
    Attendance.findOneAndUpdate.mockResolvedValueOnce({ _id: 'a1', worker_id: 'w1', status: 'present' });

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1' }] },
      supervisorA
    );

    expect(Worker.find).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorA._id,
      _id: { $in: ['w1'] },
    });
    expect(result.recorded).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('rejects a worker belonging to another supervisor', async () => {
    Worker.find.mockResolvedValueOnce([]);

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w-other' }] },
      supervisorB
    );

    expect(result.recorded).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toEqual([
      { worker_id: 'w-other', message: 'Worker not found or not accessible' },
    ]);
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('upserts attendance for valid workers with default status "present"', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1', name: 'John' }]);
    Attendance.findOneAndUpdate.mockResolvedValueOnce({ _id: 'a1', worker_id: 'w1', status: 'present' });

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1' }] },
      admin
    );

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      { worker_id: 'w1', farm_id: farmId, date: new Date('2026-08-18T00:00:00.000Z') },
      {
        $set: {
          worker_id: 'w1',
          farm_id: farmId,
          date: new Date('2026-08-18T00:00:00.000Z'),
          status: 'present',
          recorded_by: admin._id,
        },
        $unset: { check_in: "", check_out: "" },
      },
      { upsert: true, new: true, runValidators: true }
    );
    expect(result.recorded).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.errors).toBeUndefined();
  });

  it('collects errors thrown per-record without failing the whole batch', async () => {
    Worker.find.mockResolvedValueOnce([
      { _id: 'w1', name: 'John' },
      { _id: 'w2', name: 'Jane' },
    ]);
    Attendance.findOneAndUpdate
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ _id: 'a2', worker_id: 'w2', status: 'present' });

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1' }, { worker_id: 'w2' }] },
      admin
    );

    expect(result.recorded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toEqual([{ worker_id: 'w1', message: 'boom' }]);
  });

  it('defaults absent workers into the results but not present-only fields', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1', name: 'John' }]);
    Attendance.findOneAndUpdate.mockResolvedValueOnce({ _id: 'a1', worker_id: 'w1', status: 'absent' });

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1', status: 'absent' }] },
      admin
    );

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'absent' }) }),
      expect.anything()
    );
    expect(result.recorded).toBe(1);
  });
});

describe('getAttendanceByDateService', () => {
  const farmId = 'farm-1';

  it('scopes accessible active workers to the farm for an admin', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.find.mockReturnValueOnce(queryMock([]));

    await getAttendanceByDateService(farmId, { date: '2026-08-18' }, admin);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: farmId, status: 'active' });
  });

  it('scopes accessible active workers to the farm and supervisor for a supervisor', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.find.mockReturnValueOnce(queryMock([]));

    await getAttendanceByDateService(farmId, { date: '2026-08-18' }, supervisorA);

    expect(Worker.find).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorA._id,
      status: 'active',
    });
  });

  it('fetches attendance only for the accessible worker ids', async () => {
    Worker.find.mockReturnValueOnce(queryMock([{ _id: 'w1', name: 'Amy' }]));
    Attendance.find.mockReturnValueOnce(queryMock([]));

    await getAttendanceByDateService(farmId, { date: '2026-08-18' }, supervisorA);

    expect(Attendance.find).toHaveBeenCalledWith({
      farm_id: farmId,
      date: new Date('2026-08-18T00:00:00.000Z'),
      worker_id: { $in: ['w1'] },
    });
  });

  it('returns recorded attendance sorted by worker name and unrecorded active workers', async () => {
    const records = [
      { worker_id: { id: 'w2', name: 'Zed' } },
      { worker_id: { id: 'w1', name: 'Amy' } },
    ];
    Worker.find.mockReturnValueOnce(
      queryMock([
        { _id: 'w1', name: 'Amy' },
        { _id: 'w3', name: 'Bo' },
      ])
    );
    Attendance.find.mockReturnValueOnce(queryMock(records));

    const result = await getAttendanceByDateService(farmId, { date: '2026-08-18' }, admin);

    expect(result.date).toEqual(new Date('2026-08-18T00:00:00.000Z'));
    expect(result.total_recorded).toBe(2);
    expect(result.records[0].worker_id.name).toBe('Amy');
    expect(result.records[1].worker_id.name).toBe('Zed');
    expect(result.total_unrecorded).toBe(1);
    expect(result.unrecorded_workers).toEqual([{ _id: 'w3', name: 'Bo' }]);
  });

  it('a supervisor only sees their own workers in records and unrecorded_workers', async () => {
    Worker.find.mockReturnValueOnce(queryMock([{ _id: 'w1', name: 'Amy' }]));
    Attendance.find.mockReturnValueOnce(queryMock([]));

    const result = await getAttendanceByDateService(farmId, { date: '2026-08-18' }, supervisorA);

    expect(result.total_unrecorded).toBe(1);
    expect(result.unrecorded_workers).toEqual([{ _id: 'w1', name: 'Amy' }]);
  });
});

describe('getWorkerAttendanceService', () => {
  const farmId = '507f1f77bcf86cd799439011';
  const workerId = '507f1f77bcf86cd799439012';

  it('throws a 404 when the worker is not accessible to the requesting user', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(
      getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, supervisorB)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Attendance.aggregate).not.toHaveBeenCalled();
  });

  it('scopes the worker existence check to the requesting supervisor', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: workerId }));
    Attendance.aggregate.mockResolvedValueOnce([{ records: [], summary: [], total: [] }]);

    await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, supervisorA);

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorA._id,
      _id: workerId,
    });
  });

  it('allows an admin to view any worker in the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: workerId }));
    Attendance.aggregate.mockResolvedValueOnce([{ records: [], summary: [], total: [] }]);

    await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, admin);

    expect(Worker.findOne).toHaveBeenCalledWith({ farm_id: farmId, _id: workerId });
  });

  it('defaults status counts to zero and fills them in from the aggregation result', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: workerId }));
    Attendance.aggregate.mockResolvedValueOnce([
      {
        records: [{ _id: 'a1', status: 'present' }],
        summary: [
          { _id: 'present', count: 3 },
          { _id: 'absent', count: 1 },
        ],
        total: [{ count: 4 }],
      },
    ]);

    const result = await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, admin);

    expect(result).toEqual({
      total: 4,
      summary: { present: 3, absent: 1, excused: 0 },
      records: [{ _id: 'a1', status: 'present' }],
    });
  });

  it('returns total 0 and empty records when the aggregation finds nothing', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: workerId }));
    Attendance.aggregate.mockResolvedValueOnce([
      { records: [], summary: [], total: [] },
    ]);

    const result = await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, admin);

    expect(result).toEqual({
      total: 0,
      summary: { present: 0, absent: 0, excused: 0 },
      records: [],
    });
  });

  it('matches on the farm and worker ids converted to ObjectIds', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: workerId }));
    Attendance.aggregate.mockResolvedValueOnce([{ records: [], summary: [], total: [] }]);

    await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 }, admin);

    const pipeline = Attendance.aggregate.mock.calls[0][0];
    const match = pipeline[0].$match;
    expect(match.farm_id.toString()).toBe(farmId);
    expect(match.worker_id.toString()).toBe(workerId);
  });
});

describe('getMonthlySummaryService', () => {
  const farmId = '507f1f77bcf86cd799439011';

  it('scopes accessible workers to the farm for an admin', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.aggregate.mockResolvedValueOnce([]);

    await getMonthlySummaryService(farmId, undefined, admin);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: farmId });
  });

  it('scopes accessible workers to the farm and supervisor for a supervisor', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.aggregate.mockResolvedValueOnce([]);

    await getMonthlySummaryService(farmId, undefined, supervisorA);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: farmId, supervisor_id: supervisorA._id });
  });

  it('restricts the aggregation match to the accessible worker ids', async () => {
    Worker.find.mockReturnValueOnce(queryMock([{ _id: 'w1' }, { _id: 'w2' }]));
    Attendance.aggregate.mockResolvedValueOnce([]);

    await getMonthlySummaryService(farmId, 3, supervisorA);

    const pipeline = Attendance.aggregate.mock.calls[0][0];
    const match = pipeline[0].$match;
    expect(match.worker_id).toEqual({ $in: ['w1', 'w2'] });
    expect(match.farm_id.toString()).toBe(farmId);
  });

  it('defaults to 6 months when none is given, oldest first', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.aggregate.mockResolvedValueOnce([]);

    const buckets = await getMonthlySummaryService(farmId, undefined, admin);

    expect(buckets).toHaveLength(6);
    for (const bucket of buckets) {
      expect(bucket).toMatchObject({ present: 0, absent: 0, excused: 0, total: 0 });
    }
  });

  it('clamps months above 12 down to 12', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Attendance.aggregate.mockResolvedValueOnce([]);

    const buckets = await getMonthlySummaryService(farmId, 20, admin);

    expect(buckets).toHaveLength(12);
  });

  it('fills matching buckets with aggregated counts and leaves the rest zeroed', async () => {
    const now = new Date();
    Worker.find.mockReturnValueOnce(queryMock([{ _id: 'w1' }]));
    Attendance.aggregate.mockResolvedValueOnce([
      {
        _id: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
        present: 5,
        absent: 2,
        excused: 1,
        total: 8,
      },
    ]);

    const buckets = await getMonthlySummaryService(farmId, 3, admin);

    expect(buckets).toHaveLength(3);
    const currentBucket = buckets[buckets.length - 1];
    expect(currentBucket).toMatchObject({
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      present: 5,
      absent: 2,
      excused: 1,
      total: 8,
    });
    expect(buckets[0]).toMatchObject({ present: 0, absent: 0, excused: 0, total: 0 });
  });
});

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAttendanceService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when the worker does not exist on the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(
      createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, 'user-1')
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found on this farm',
    });

    expect(Attendance.create).not.toHaveBeenCalled();
  });

  it('throws a 400 when attendance already recorded for that worker/date', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock({ _id: 'existing' }));

    await expect(
      createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, 'user-1')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Attendance already recorded for this worker on this date',
    });

    expect(Attendance.create).not.toHaveBeenCalled();
  });

  it('normalizes the date to UTC midnight and defaults check_in/check_out to undefined', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'w1' }));
    Attendance.findOne.mockReturnValueOnce(queryMock(null));
    Attendance.create.mockResolvedValueOnce({ _id: 'a1' });

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18', status: 'present' }, 'user-1');

    expect(Attendance.create).toHaveBeenCalledWith({
      worker_id: 'w1',
      farm_id: farmId,
      date: new Date('2026-08-18T00:00:00.000Z'),
      status: 'present',
      check_in: undefined,
      check_out: undefined,
      recorded_by: 'user-1',
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
      'user-1'
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

    await createAttendanceService(farmId, { worker_id: 'w1', date: '2026-08-18' }, 'user-1');

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
      'user-1'
    );

    expect(result).toEqual({
      recorded: 0,
      failed: 1,
      results: [],
      errors: [{ worker_id: 'missing', message: 'Worker not found on this farm' }],
    });
    expect(Attendance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('upserts attendance for valid workers with default status "present"', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1', name: 'John' }]);
    Attendance.findOneAndUpdate.mockResolvedValueOnce({ _id: 'a1', worker_id: 'w1', status: 'present' });

    const result = await bulkCreateAttendanceService(
      farmId,
      { date: '2026-08-18', records: [{ worker_id: 'w1' }] },
      'user-1'
    );

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      { worker_id: 'w1', date: new Date('2026-08-18T00:00:00.000Z') },
      expect.objectContaining({
        worker_id: 'w1',
        farm_id: farmId,
        date: new Date('2026-08-18T00:00:00.000Z'),
        status: 'present',
        check_in: undefined,
        check_out: undefined,
        recorded_by: 'user-1',
      }),
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
      'user-1'
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
      'user-1'
    );

    expect(Attendance.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'absent' }),
      expect.anything()
    );
    expect(result.recorded).toBe(1);
  });
});

describe('getAttendanceByDateService', () => {
  const farmId = 'farm-1';

  it('returns recorded attendance sorted by worker name and unrecorded active workers', async () => {
    const records = [
      { worker_id: { id: 'w2', name: 'Zed' } },
      { worker_id: { id: 'w1', name: 'Amy' } },
    ];
    Attendance.find.mockReturnValueOnce(queryMock(records));
    Worker.find.mockReturnValueOnce(
      queryMock([
        { _id: 'w1', name: 'Amy' },
        { _id: 'w3', name: 'Bo' },
      ])
    );

    const result = await getAttendanceByDateService(farmId, { date: '2026-08-18' });

    expect(Attendance.find).toHaveBeenCalledWith({
      farm_id: farmId,
      date: new Date('2026-08-18T00:00:00.000Z'),
    });
    expect(result.date).toEqual(new Date('2026-08-18T00:00:00.000Z'));
    expect(result.total_recorded).toBe(2);
    expect(result.records[0].worker_id.name).toBe('Amy');
    expect(result.records[1].worker_id.name).toBe('Zed');
    expect(result.total_unrecorded).toBe(1);
    expect(result.unrecorded_works).toEqual([{ _id: 'w3', name: 'Bo' }]);
  });

  it('scopes the active-workers lookup to the farm', async () => {
    Attendance.find.mockReturnValueOnce(queryMock([]));
    Worker.find.mockReturnValueOnce(queryMock([]));

    await getAttendanceByDateService(farmId, { date: '2026-08-18' });

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: farmId, status: 'active' });
  });
});

describe('getWorkerAttendanceService', () => {
  const farmId = '507f1f77bcf86cd799439011';
  const workerId = '507f1f77bcf86cd799439012';

  it('defaults status counts to zero and fills them in from the aggregation result', async () => {
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

    const result = await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 });

    expect(result).toEqual({
      total: 4,
      summary: { present: 3, absent: 1, excused: 0 },
      records: [{ _id: 'a1', status: 'present' }],
    });
  });

  it('returns total 0 and empty records when the aggregation finds nothing', async () => {
    Attendance.aggregate.mockResolvedValueOnce([
      { records: [], summary: [], total: [] },
    ]);

    const result = await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 });

    expect(result).toEqual({
      total: 0,
      summary: { present: 0, absent: 0, excused: 0 },
      records: [],
    });
  });

  it('matches on the farm and worker ids converted to ObjectIds', async () => {
    Attendance.aggregate.mockResolvedValueOnce([{ records: [], summary: [], total: [] }]);

    await getWorkerAttendanceService(farmId, workerId, { month: 8, year: 2026 });

    const pipeline = Attendance.aggregate.mock.calls[0][0];
    const match = pipeline[0].$match;
    expect(match.farm_id.toString()).toBe(farmId);
    expect(match.worker_id.toString()).toBe(workerId);
  });
});

describe('getMonthlySummaryService', () => {
  const farmId = 'farm-1';

  it('defaults to 6 months when none is given, oldest first', async () => {
    Attendance.aggregate.mockResolvedValueOnce([]);

    const buckets = await getMonthlySummaryService(farmId, undefined);

    expect(buckets).toHaveLength(6);
    for (const bucket of buckets) {
      expect(bucket).toMatchObject({ present: 0, absent: 0, excused: 0, total: 0 });
    }
  });

  it('clamps months above 12 down to 12', async () => {
    Attendance.aggregate.mockResolvedValueOnce([]);

    const buckets = await getMonthlySummaryService(farmId, 20);

    expect(buckets).toHaveLength(12);
  });

  it('fills matching buckets with aggregated counts and leaves the rest zeroed', async () => {
    const now = new Date();
    Attendance.aggregate.mockResolvedValueOnce([
      {
        _id: { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
        present: 5,
        absent: 2,
        excused: 1,
        total: 8,
      },
    ]);

    const buckets = await getMonthlySummaryService(farmId, 3);

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

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/Worker.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

vi.mock('../../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Worker from '../../models/Worker.js';
import User from '../../models/User.js';
import {
  createWorkerService,
  listWorkersService,
  getWorkerService,
  updateWorkerService,
  deleteWorkerService,
} from '../../services/worker.service.js';


const queryMock = (resolvedValue) => {
  const query = {
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    sort: vi.fn(() => query),
    populate: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return query;
};

const admin = { _id: 'admin-1', role: 'admin' };
const supervisorA = { _id: 'sup-a', role: 'supervisor' };
const supervisorB = { _id: 'sup-b', role: 'supervisor' };

beforeEach(() => {
  vi.clearAllMocks();
  // Default: any supervisor_id looked up resolves to an active supervisor,
  // so existing tests that pass a supervisor_id don't need to care about
  // this check unless they're specifically testing it.
  User.findOne.mockResolvedValue({ _id: 'some-supervisor', role: 'supervisor', status: 'active' });
});

describe('createWorkerService', () => {
  const farmId = 'farm-1';

  it('throws a 400 when a worker with the same CIN already exists on the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock({ _id: 'existing' }));

    await expect(
      createWorkerService({ name: 'John', CIN: 'ABC123', daily_rate: 100 }, farmId, admin)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "A worker with CIN 'ABC123' already exists on this farm.",
    });

    expect(Worker.create).not.toHaveBeenCalled();
  });

  it('creates a worker and keeps supervisor_id when the requester is an admin', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));
    Worker.create.mockResolvedValueOnce({ _id: 'w1' });

    await createWorkerService(
      { name: 'John', CIN: 'ABC123', daily_rate: 100, supervisor_id: 'sup-1' },
      farmId,
      admin
    );

    expect(User.findOne).toHaveBeenCalledWith({
      _id: 'sup-1',
      farm_id: farmId,
      role: 'supervisor',
      status: 'active',
    });
    expect(Worker.create).toHaveBeenCalledWith(
      expect.objectContaining({ supervisor_id: 'sup-1' })
    );
  });

  it('rejects assigning a worker to an inactive or missing supervisor', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));
    User.findOne.mockResolvedValueOnce(null);

    await expect(
      createWorkerService(
        { name: 'John', CIN: 'ABC123', daily_rate: 100, supervisor_id: 'inactive-sup' },
        farmId,
        admin
      )
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(Worker.create).not.toHaveBeenCalled();
  });

  it('does not validate a supervisor when none is provided by an admin', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));
    Worker.create.mockResolvedValueOnce({ _id: 'w1' });

    await createWorkerService({ name: 'John', CIN: 'ABC123', daily_rate: 100 }, farmId, admin);

    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('defaults supervisor_id to null for an admin who did not send one', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));
    Worker.create.mockResolvedValueOnce({ _id: 'w1' });

    await createWorkerService({ name: 'John', CIN: 'ABC123', daily_rate: 100 }, farmId, admin);

    expect(Worker.create).toHaveBeenCalledWith(expect.objectContaining({ supervisor_id: null }));
  });

  it('forces supervisor_id to the requesting supervisor even if a different one was sent', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));
    Worker.create.mockResolvedValueOnce({ _id: 'w1' });

    await createWorkerService(
      { name: 'John', CIN: 'ABC123', daily_rate: 100, supervisor_id: 'sup-b' },
      farmId,
      supervisorA
    );

    expect(Worker.create).toHaveBeenCalledWith(
      expect.objectContaining({ supervisor_id: supervisorA._id })
    );
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('converts join_date to a Date when provided, and leaves it undefined otherwise', async () => {
    Worker.findOne.mockReturnValue(queryMock(null));
    Worker.create.mockResolvedValue({ _id: 'w1' });

    await createWorkerService(
      { name: 'John', CIN: 'ABC123', daily_rate: 100, join_date: '2026-01-01' },
      farmId,
      admin
    );
    expect(Worker.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ join_date: new Date('2026-01-01') })
    );

    await createWorkerService({ name: 'John', CIN: 'DEF456', daily_rate: 100 }, farmId, admin);
    expect(Worker.create).toHaveBeenLastCalledWith(expect.objectContaining({ join_date: undefined }));
  });
});

describe('listWorkersService', () => {
  it('scopes the query to the given farm with no optional filters (admin)', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Worker.countDocuments.mockResolvedValueOnce(0);

    await listWorkersService('farm-1', { page: 1, limit: 20 }, admin);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: 'farm-1' });
    expect(Worker.countDocuments).toHaveBeenCalledWith({ farm_id: 'farm-1' });
  });

  it('admin lists all farm workers regardless of supervisor', async () => {
    const workers = [{ _id: 'w1', supervisor_id: 'sup-a' }, { _id: 'w2', supervisor_id: 'sup-b' }];
    Worker.find.mockReturnValueOnce(queryMock(workers));
    Worker.countDocuments.mockResolvedValueOnce(2);

    const result = await listWorkersService('farm-1', { page: 1, limit: 20 }, admin);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: 'farm-1' });
    expect(result.workers).toEqual(workers);
  });

  it('supervisor lists only their own workers', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Worker.countDocuments.mockResolvedValueOnce(0);

    await listWorkersService('farm-1', { page: 1, limit: 20 }, supervisorA);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: 'farm-1', supervisor_id: supervisorA._id });
    expect(Worker.countDocuments).toHaveBeenCalledWith({ farm_id: 'farm-1', supervisor_id: supervisorA._id });
  });

  it('adds a status filter when provided', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Worker.countDocuments.mockResolvedValueOnce(0);

    await listWorkersService('farm-1', { status: 'inactive', page: 1, limit: 20 }, admin);

    expect(Worker.find).toHaveBeenCalledWith({ farm_id: 'farm-1', status: 'inactive' });
  });

  it('adds a case-insensitive name regex filter when search is provided', async () => {
    Worker.find.mockReturnValueOnce(queryMock([]));
    Worker.countDocuments.mockResolvedValueOnce(0);

    await listWorkersService('farm-1', { search: 'ali', page: 1, limit: 20 }, admin);

    expect(Worker.find).toHaveBeenCalledWith({
      farm_id: 'farm-1',
      name: { $regex: 'ali', $options: 'i' },
    });
  });

  it('sorts by createdAt descending', async () => {
    const query = queryMock([]);
    Worker.find.mockReturnValueOnce(query);
    Worker.countDocuments.mockResolvedValueOnce(0);

    await listWorkersService('farm-1', { page: 1, limit: 20 }, admin);

    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('returns paginated results with computed page count', async () => {
    const workers = [{ _id: 'w1' }, { _id: 'w2' }];
    Worker.find.mockReturnValueOnce(queryMock(workers));
    Worker.countDocuments.mockResolvedValueOnce(5);

    const result = await listWorkersService('farm-1', { page: 2, limit: 2 }, admin);

    expect(result).toEqual({
      pagination: { total: 5, page: 2, limit: 2, pages: 3 },
      workers,
    });
  });
});

describe('getWorkerService', () => {
  it('returns the worker when found on the given farm (admin)', async () => {
    const worker = { _id: 'w1', farm_id: 'farm-1' };
    Worker.findOne.mockReturnValueOnce(queryMock(worker));

    const result = await getWorkerService('w1', 'farm-1', admin);

    expect(Worker.findOne).toHaveBeenCalledWith({ farm_id: 'farm-1', _id: 'w1' });
    expect(result).toBe(worker);
  });

  it('throws a 404 when the worker does not exist on the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(getWorkerService('missing', 'farm-1', admin)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });
  });

  it('supervisor can get their own worker', async () => {
    const worker = { _id: 'w1', farm_id: 'farm-1', supervisor_id: supervisorA._id };
    Worker.findOne.mockReturnValueOnce(queryMock(worker));

    const result = await getWorkerService('w1', 'farm-1', supervisorA);

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: 'farm-1',
      supervisor_id: supervisorA._id,
      _id: 'w1',
    });
    expect(result).toBe(worker);
  });

  it('supervisor cannot get another supervisor\'s worker', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(getWorkerService('w1', 'farm-1', supervisorB)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: 'farm-1',
      supervisor_id: supervisorB._id,
      _id: 'w1',
    });
  });
});

describe('updateWorkerService', () => {
  const farmId = 'farm-1';
  const existingWorker = { _id: 'w1', farm_id: farmId, CIN: 'ABC123', supervisor_id: supervisorA._id };

  it('throws a 404 when the worker is not found on the farm', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(updateWorkerService('w1', farmId, {}, admin)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });
    expect(Worker.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('supervisor cannot update another supervisor\'s worker', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(null));

    await expect(
      updateWorkerService('w1', farmId, { name: 'Hacked' }, supervisorB)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Worker.findOne).toHaveBeenCalledWith({
      farm_id: farmId,
      supervisor_id: supervisorB._id,
      _id: 'w1',
    });
    expect(Worker.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('skips the CIN uniqueness check when CIN is unchanged', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock({ ...existingWorker, name: 'New Name' }));

    await updateWorkerService('w1', farmId, { CIN: 'ABC123', name: 'New Name' }, admin);

    expect(Worker.findOne).toHaveBeenCalledTimes(1);
  });

  it('checks CIN uniqueness scoped to the current farm when CIN changes, and rejects a duplicate', async () => {
    Worker.findOne
      .mockReturnValueOnce(queryMock(existingWorker))
      .mockReturnValueOnce(queryMock({ _id: 'other-worker' }));

    await expect(
      updateWorkerService('w1', farmId, { CIN: 'NEWCIN' }, admin)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "A worker with CIN 'NEWCIN' already exists on this farm.",
    });

    expect(Worker.findOne).toHaveBeenNthCalledWith(2, { farm_id: farmId, CIN: 'NEWCIN' });
  });

  it('allows changing CIN to a value unique on the farm', async () => {
    Worker.findOne
      .mockReturnValueOnce(queryMock(existingWorker))
      .mockReturnValueOnce(queryMock(null));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock({ ...existingWorker, CIN: 'NEWCIN' }));

    const result = await updateWorkerService('w1', farmId, { CIN: 'NEWCIN' }, admin);

    expect(result.CIN).toBe('NEWCIN');
  });

  it('maps supervisor_id "" to null for an admin, and passes through other values', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(existingWorker));

    await updateWorkerService('w1', farmId, { supervisor_id: '' }, admin);
    expect(Worker.findOneAndUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ farm_id: farmId, _id: 'w1' }),
      expect.objectContaining({ supervisor_id: null }),
      expect.any(Object)
    );
    // Unassigning (null) never needs to validate a supervisor.
    expect(User.findOne).not.toHaveBeenCalled();

    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(existingWorker));
    await updateWorkerService('w1', farmId, { supervisor_id: 'sup-1' }, admin);
    expect(User.findOne).toHaveBeenCalledWith({
      _id: 'sup-1',
      farm_id: farmId,
      role: 'supervisor',
      status: 'active',
    });
    expect(Worker.findOneAndUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ farm_id: farmId, _id: 'w1' }),
      expect.objectContaining({ supervisor_id: 'sup-1' }),
      expect.any(Object)
    );
  });

  it('rejects reassigning a worker to an inactive or missing supervisor', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    User.findOne.mockResolvedValueOnce(null);

    await expect(
      updateWorkerService('w1', farmId, { supervisor_id: 'inactive-sup' }, admin)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(Worker.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does not re-validate the supervisor when supervisor_id is not part of the update', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock({ ...existingWorker, name: 'New Name' }));

    await updateWorkerService('w1', farmId, { name: 'New Name' }, admin);

    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('strips supervisor_id entirely for a supervisor, leaving it unchanged', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(existingWorker));

    await updateWorkerService('w1', farmId, { supervisor_id: 'sup-1' }, supervisorA);

    const updateData = Worker.findOneAndUpdate.mock.calls[0][1];
    expect(updateData).not.toHaveProperty('supervisor_id');
  });

  it('supervisor cannot reassign their own worker to another supervisor', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(existingWorker));

    await updateWorkerService('w1', farmId, { supervisor_id: supervisorB._id }, supervisorA);

    const updateData = Worker.findOneAndUpdate.mock.calls[0][1];
    expect(updateData).not.toHaveProperty('supervisor_id');
    expect(Worker.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ farm_id: farmId, supervisor_id: supervisorA._id, _id: 'w1' }),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('converts join_date to a Date when provided', async () => {
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(existingWorker));

    await updateWorkerService('w1', farmId, { join_date: '2026-02-01' }, admin);

    expect(Worker.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ farm_id: farmId, _id: 'w1' }),
      expect.objectContaining({ join_date: new Date('2026-02-01') }),
      expect.any(Object)
    );
  });

  it('returns the updated, populated worker', async () => {
    const updated = { ...existingWorker, name: 'Updated' };
    Worker.findOne.mockReturnValueOnce(queryMock(existingWorker));
    Worker.findOneAndUpdate.mockReturnValueOnce(queryMock(updated));

    const result = await updateWorkerService('w1', farmId, { name: 'Updated' }, admin);

    expect(result).toBe(updated);
    expect(Worker.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ farm_id: farmId, _id: 'w1' }),
      expect.objectContaining({ name: 'Updated' }),
      { new: true, runValidators: true }
    );
  });
});

describe('deleteWorkerService', () => {
  it('throws a 404 when the worker is not found on the farm', async () => {
    Worker.findOneAndDelete.mockReturnValueOnce(queryMock(null));

    await expect(deleteWorkerService('missing', 'farm-1', admin)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });
  });

  it('deletes the worker scoped to the farm and returns its id (admin)', async () => {
    Worker.findOneAndDelete.mockReturnValueOnce(queryMock({ _id: 'w1' }));

    const result = await deleteWorkerService('w1', 'farm-1', admin);

    expect(Worker.findOneAndDelete).toHaveBeenCalledWith({ farm_id: 'farm-1', _id: 'w1' });
    expect(result).toBe('w1');
  });

  it('supervisor cannot delete another supervisor\'s worker', async () => {
    Worker.findOneAndDelete.mockReturnValueOnce(queryMock(null));

    await expect(deleteWorkerService('w1', 'farm-1', supervisorB)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Worker not found or not accessible',
    });

    expect(Worker.findOneAndDelete).toHaveBeenCalledWith({
      farm_id: 'farm-1',
      supervisor_id: supervisorB._id,
      _id: 'w1',
    });
  });

  it('supervisor can delete their own worker', async () => {
    Worker.findOneAndDelete.mockReturnValueOnce(queryMock({ _id: 'w1' }));

    const result = await deleteWorkerService('w1', 'farm-1', supervisorA);

    expect(Worker.findOneAndDelete).toHaveBeenCalledWith({
      farm_id: 'farm-1',
      supervisor_id: supervisorA._id,
      _id: 'w1',
    });
    expect(result).toBe('w1');
  });
});

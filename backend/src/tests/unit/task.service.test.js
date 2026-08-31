import { describe, it, expect, vi, beforeEach } from 'vitest';
import Task from '../../models/Task.js';
import Worker from '../../models/Worker.js';
import { authorizeWorkersForTask } from '../../services/workerAssignmentAuth.service.js';
import { POPULATE_ASSIGNEE, POPULATE_ASSIGNER } from '../../utils/constant.js';
import {
  createTaskService,
  getTasksService,
  getMyTasksService,
  updateMyTaskStatusService,
  getTasksByWorkerService,
  updateAssignmentStatusService,
  rateAssignmentService,
  addAssigneesService,
  removeAssigneeService,
  deleteTaskService,
} from '../../services/task.service.js';

vi.mock('../../models/Task.js', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../models/Worker.js', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../services/workerAssignmentAuth.service.js', () => ({
  authorizeWorkersForTask: vi.fn(),
}));

const queryMock = (resolvedValue) => {
  const query = {
    skip: vi.fn(() => query),
    sort: vi.fn(() => query),
    limit: vi.fn(() => query),
    populate: vi.fn(() => query),
    lean: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
  };
  return query;
};

const makeTaskDoc = (overrides = {}) => ({
  _id: 'task-1',
  assignments: [],
  save: vi.fn().mockResolvedValue(undefined),
  populate: vi.fn().mockResolvedValue(undefined),
  toObject: vi.fn(function toObject() {
    return { _id: this._id, assignments: this.assignments };
  }),
  assignmentFor: vi.fn(),
  recomputeStatus: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createTaskService', () => {
  const farmId = 'farm-1';
  const user = { _id: 'user-1', role: 'supervisor' };

  it('throws a 404 when one or more workers are not found on this farm', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }]);

    await expect(
      createTaskService(farmId, user, { worker_ids: ['w1', 'w2'], title: 'T', date: '2026-08-25' })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'One or more workers were not found on this farm',
    });
    expect(Task.create).not.toHaveBeenCalled();
  });

  it('deduplicates worker_ids before the lookup so repeated ids do not trigger a false 404', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: ['w1'], unauthorized: [] });
    const created = makeTaskDoc();
    Task.create.mockResolvedValueOnce(created);

    await createTaskService(farmId, user, { worker_ids: ['w1', 'w1'], title: 'T', date: '2026-08-25' });

    expect(Worker.find).toHaveBeenCalledWith({ _id: { $in: ['w1'] }, farm_id: farmId });
    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignments: [{ worker_id: 'w1', status: 'pending' }] })
    );
  });

  it('throws a 403 with the unauthorized worker ids when the caller does not supervise a worker', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: [], unauthorized: ['w1'] });

    await expect(
      createTaskService(farmId, user, { worker_ids: ['w1'], title: 'T', date: '2026-08-25' })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not supervise these workers',
      unauthorized_worker_ids: ['w1'],
    });
    expect(Task.create).not.toHaveBeenCalled();
  });

  it('creates the task with a pending assignment per worker and populates the result', async () => {
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }, { _id: 'w2' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: ['w1', 'w2'], unauthorized: [] });
    const created = makeTaskDoc();
    Task.create.mockResolvedValueOnce(created);

    const result = await createTaskService(farmId, user, {
      worker_ids: ['w1', 'w2'],
      title: 'Harvest field',
      description: 'desc',
      date: '2026-08-25',
    });

    expect(Task.create).toHaveBeenCalledWith({
      farm_id: farmId,
      assigned_by: user._id,
      title: 'Harvest field',
      description: 'desc',
      date: new Date('2026-08-25'),
      assignments: [
        { worker_id: 'w1', status: 'pending' },
        { worker_id: 'w2', status: 'pending' },
      ],
    });
    expect(created.populate).toHaveBeenCalledWith([POPULATE_ASSIGNEE, POPULATE_ASSIGNER]);
    expect(result).toBe(created);
  });
});

describe('getTasksService', () => {
  const farmId = 'farm-1';

  it('builds the query from worker_id, status and date, and paginates', async () => {
    Task.countDocuments.mockResolvedValueOnce(1);
    Task.find.mockReturnValueOnce(queryMock([{ _id: 't1' }]));

    const result = await getTasksService(farmId, {
      worker_id: 'w1',
      status: 'pending',
      date: '2026-08-25',
      page: 2,
      limit: 10,
    });

    const expectedQuery = {
      farm_id: farmId,
      'assignments.worker_id': 'w1',
      status: 'pending',
      date: { $gte: new Date('2026-08-25'), $lt: new Date('2026-08-26') },
    };
    expect(Task.countDocuments).toHaveBeenCalledWith(expectedQuery);
    expect(Task.find).toHaveBeenCalledWith(expectedQuery);
    expect(result.pagination).toEqual({ total: 1, page: 2, limit: 10, pages: 1 });
    expect(result.tasks).toEqual([{ _id: 't1' }]);
  });

  it('sorts by date then createdAt, newest first', async () => {
    Task.countDocuments.mockResolvedValueOnce(0);
    const query = queryMock([]);
    Task.find.mockReturnValueOnce(query);

    await getTasksService(farmId, {});

    expect(query.sort).toHaveBeenCalledWith({ date: -1, createdAt: -1 });
  });
});

describe('getMyTasksService', () => {
  const farmId = 'farm-1';
  const workerId = 'w1';

  it('filters by worker_id only when no status is given', async () => {
    Task.countDocuments.mockResolvedValueOnce(0);
    Task.find.mockReturnValueOnce(queryMock([]));

    await getMyTasksService(farmId, workerId, {});

    expect(Task.find).toHaveBeenCalledWith({ farm_id: farmId, 'assignments.worker_id': workerId });
  });

  it('uses an $elemMatch on assignments when a status filter is given', async () => {
    Task.countDocuments.mockResolvedValueOnce(0);
    Task.find.mockReturnValueOnce(queryMock([]));

    await getMyTasksService(farmId, workerId, { status: 'done' });

    expect(Task.find).toHaveBeenCalledWith({
      farm_id: farmId,
      assignments: { $elemMatch: { worker_id: workerId, status: 'done' } },
    });
  });

  it('attaches my_assignment to each shaped task', async () => {
    const myAssignment = { worker_id: workerId, status: 'pending' };
    const taskDoc = makeTaskDoc({
      _id: 't1',
      assignmentFor: vi.fn().mockReturnValue(myAssignment),
      toObject: vi.fn().mockReturnValue({ _id: 't1' }),
    });
    Task.countDocuments.mockResolvedValueOnce(1);
    Task.find.mockReturnValueOnce(queryMock([taskDoc]));

    const result = await getMyTasksService(farmId, workerId, {});

    expect(result.shaped).toEqual([{ _id: 't1', my_assignment: myAssignment }]);
  });
});

describe('updateMyTaskStatusService', () => {
  const farmId = 'farm-1';
  const workerId = 'w1';
  const taskId = 't1';

  it('throws a 403 when the account is not linked to a worker record', async () => {
    await expect(
      updateMyTaskStatusService(farmId, undefined, taskId, { status: 'done' })
    ).rejects.toMatchObject({ statusCode: 403, message: 'This account is not linked to a worker record' });
    expect(Task.findOne).not.toHaveBeenCalled();
  });

  it('throws a 404 when no task matches the worker on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(null);

    await expect(
      updateMyTaskStatusService(farmId, workerId, taskId, { status: 'done' })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
  });

  it('sets completed_at when marking done and clears it otherwise', async () => {
    const assignment = { status: 'pending', completed_at: null };
    const taskDoc = makeTaskDoc({ assignmentFor: vi.fn().mockReturnValue(assignment) });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await updateMyTaskStatusService(farmId, workerId, taskId, { status: 'done' });

    expect(assignment.status).toBe('done');
    expect(assignment.completed_at).toBeInstanceOf(Date);
    expect(taskDoc.recomputeStatus).toHaveBeenCalled();
    expect(taskDoc.save).toHaveBeenCalled();
  });

  it('clears completed_at when status is not done', async () => {
    const assignment = { status: 'done', completed_at: new Date('2026-08-20') };
    const taskDoc = makeTaskDoc({ assignmentFor: vi.fn().mockReturnValue(assignment) });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await updateMyTaskStatusService(farmId, workerId, taskId, { status: 'in_progress' });

    expect(assignment.completed_at).toBeNull();
  });
});

describe('getTasksByWorkerService', () => {
  const farmId = 'farm-1';
  const workerId = 'w1';

  it('adds a month/year date range only when both are given', async () => {
    const query = queryMock([]);
    Task.find.mockReturnValueOnce(query);

    await getTasksByWorkerService(farmId, workerId, { year: 2026, month: 8 });

    expect(Task.find).toHaveBeenCalledWith({
      farm_id: farmId,
      'assignments.worker_id': workerId,
      date: { $gte: new Date(2026, 7, 1), $lt: new Date(2026, 8, 1) },
    });
  });

  it('filters the returned tasks by the worker\'s own assignment status', async () => {
    const done = makeTaskDoc({
      _id: 't1',
      assignmentFor: vi.fn().mockReturnValue({ status: 'done' }),
      toObject: vi.fn().mockReturnValue({ _id: 't1' }),
    });
    const pending = makeTaskDoc({
      _id: 't2',
      assignmentFor: vi.fn().mockReturnValue({ status: 'pending' }),
      toObject: vi.fn().mockReturnValue({ _id: 't2' }),
    });
    Task.find.mockReturnValueOnce(queryMock([done, pending]));

    const result = await getTasksByWorkerService(farmId, workerId, { status: 'done' });

    expect(result).toEqual([{ _id: 't1', my_assignment: { status: 'done' } }]);
  });
});

describe('updateAssignmentStatusService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when no task matches the given task/worker on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(null);

    await expect(
      updateAssignmentStatusService(farmId, { id: 't1', worker_id: 'w1' }, { status: 'done' })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
  });

  it('updates the assignment status and recomputes the task status', async () => {
    const assignment = { status: 'pending', completed_at: null };
    const taskDoc = makeTaskDoc({ assignmentFor: vi.fn().mockReturnValue(assignment) });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    const result = await updateAssignmentStatusService(farmId, { id: 't1', worker_id: 'w1' }, { status: 'done' });

    expect(assignment.status).toBe('done');
    expect(assignment.completed_at).toBeInstanceOf(Date);
    expect(taskDoc.recomputeStatus).toHaveBeenCalled();
    expect(taskDoc.save).toHaveBeenCalled();
    expect(result).toBe(taskDoc);
  });
});

describe('rateAssignmentService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when no task matches the given task/worker on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(null);

    await expect(
      rateAssignmentService(farmId, { id: 't1', worker_id: 'w1' }, { rating: 5 })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
  });

  it('sets the rating and only updates the note when provided', async () => {
    const assignment = { rating: null, note: 'old note' };
    const taskDoc = makeTaskDoc({ assignmentFor: vi.fn().mockReturnValue(assignment) });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await rateAssignmentService(farmId, { id: 't1', worker_id: 'w1' }, { rating: 4 });

    expect(assignment.rating).toBe(4);
    expect(assignment.note).toBe('old note');
    expect(taskDoc.save).toHaveBeenCalled();
  });

  it('overwrites the note when explicitly provided', async () => {
    const assignment = { rating: null, note: 'old note' };
    const taskDoc = makeTaskDoc({ assignmentFor: vi.fn().mockReturnValue(assignment) });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await rateAssignmentService(farmId, { id: 't1', worker_id: 'w1' }, { rating: 4, note: 'great job' });

    expect(assignment.note).toBe('great job');
  });
});

describe('addAssigneesService', () => {
  const farmId = 'farm-1';
  const user = { _id: 'user-1', role: 'supervisor' };

  it('throws a 404 when the task does not exist on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(null);

    await expect(
      addAssigneesService(farmId, { worker_ids: ['w1'] }, 't1', user)
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
    expect(Worker.find).not.toHaveBeenCalled();
  });

  it('throws a 404 when one or more workers are not found on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(makeTaskDoc());
    Worker.find.mockResolvedValueOnce([]);

    await expect(
      addAssigneesService(farmId, { worker_ids: ['w1'] }, 't1', user)
    ).rejects.toMatchObject({ statusCode: 404, message: 'One or more workers were not found on this farm' });
  });

  it('deduplicates worker_ids before the lookup so repeated ids do not trigger a false 404', async () => {
    Task.findOne.mockResolvedValueOnce(makeTaskDoc());
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: ['w1'], unauthorized: [] });

    await addAssigneesService(farmId, { worker_ids: ['w1', 'w1'] }, 't1', user);

    expect(Worker.find).toHaveBeenCalledWith({ _id: { $in: ['w1'] }, farm_id: farmId });
  });

  it('only checks authorization for newly-added workers, skipping ones already assigned', async () => {
    const taskDoc = makeTaskDoc({ assignments: [{ worker_id: 'w1' }] });
    Task.findOne.mockResolvedValueOnce(taskDoc);
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }, { _id: 'w2' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: ['w2'], unauthorized: [] });

    await addAssigneesService(farmId, { worker_ids: ['w1', 'w2'] }, 't1', user);

    expect(authorizeWorkersForTask).toHaveBeenCalledWith([{ _id: 'w2' }], user);
    expect(taskDoc.assignments).toEqual([{ worker_id: 'w1' }, { worker_id: 'w2', status: 'pending' }]);
  });

  it('throws a 403 with the unauthorized worker ids', async () => {
    Task.findOne.mockResolvedValueOnce(makeTaskDoc());
    Worker.find.mockResolvedValueOnce([{ _id: 'w1' }]);
    authorizeWorkersForTask.mockResolvedValueOnce({ authorized: [], unauthorized: ['w1'] });

    await expect(
      addAssigneesService(farmId, { worker_ids: ['w1'] }, 't1', user)
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'You do not supervise these workers',
      unauthorized_worker_ids: ['w1'],
    });
  });
});

describe('removeAssigneeService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when the task does not exist on this farm', async () => {
    Task.findOne.mockResolvedValueOnce(null);

    await expect(
      removeAssigneeService(farmId, { id: 't1', worker_id: 'w1' })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
  });

  it('throws a 404 when the worker has no assignment on this task', async () => {
    const taskDoc = makeTaskDoc({
      assignments: [{ worker_id: 'w1' }, { worker_id: 'w2' }],
      assignmentFor: vi.fn().mockReturnValue(undefined),
    });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await expect(
      removeAssigneeService(farmId, { id: 't1', worker_id: 'w3' })
    ).rejects.toMatchObject({ statusCode: 404, message: 'Task not found' });
    expect(taskDoc.save).not.toHaveBeenCalled();
  });

  it('throws a 400 when trying to remove the last assignee', async () => {
    const taskDoc = makeTaskDoc({
      assignments: [{ worker_id: 'w1' }],
      assignmentFor: vi.fn().mockReturnValue({ worker_id: 'w1' }),
    });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await expect(
      removeAssigneeService(farmId, { id: 't1', worker_id: 'w1' })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Cannot remove the last worker — delete the task instead',
    });
  });

  it('removes the matching assignment and recomputes status', async () => {
    const taskDoc = makeTaskDoc({
      assignments: [{ worker_id: 'w1' }, { worker_id: 'w2' }],
      assignmentFor: vi.fn().mockReturnValue({ worker_id: 'w1' }),
    });
    Task.findOne.mockResolvedValueOnce(taskDoc);

    await removeAssigneeService(farmId, { id: 't1', worker_id: 'w1' });

    expect(taskDoc.assignments).toEqual([{ worker_id: 'w2' }]);
    expect(taskDoc.recomputeStatus).toHaveBeenCalled();
    expect(taskDoc.save).toHaveBeenCalled();
  });
});

describe('deleteTaskService', () => {
  const farmId = 'farm-1';

  it('throws a 404 when no task is found to delete', async () => {
    Task.findOneAndDelete.mockResolvedValueOnce(null);

    await expect(deleteTaskService(farmId, 't1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Task not found',
    });
  });

  it('returns the task id when deleted', async () => {
    Task.findOneAndDelete.mockResolvedValueOnce({ _id: 't1' });

    const result = await deleteTaskService(farmId, 't1');

    expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: 't1', farm_id: farmId });
    expect(result).toBe('t1');
  });
});

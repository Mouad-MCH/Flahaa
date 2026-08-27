import Task from "../models/Task.js";
import Worker from "../models/Worker.js";
import { authorizeWorkersForTask } from "./workerAssignmentAuth.service.js";
import { POPULATE_ASSIGNEE, POPULATE_ASSIGNER } from '../utils/constant.js'


export const createTaskService = async (farm_id, user, data) => {
    const { worker_ids: rawWorkerIds, title, description, date } = data;
    const worker_ids = [...new Set(rawWorkerIds.map(String))];

    const workers = await Worker.find({ _id: { $in: worker_ids }, farm_id });

    if(workers.length !== worker_ids.length) {
        const error = new Error("One or more workers were not found on this farm");
        error.statusCode = 404;
        throw error;
    }

    const { unauthorized } = await authorizeWorkersForTask(workers, user);

    if(unauthorized.length > 0) {
        const error = new Error('You do not supervise these workers');
        error.statusCode = 403;
        error.unauthorized_worker_ids= unauthorized;
        throw error;
    }

    const task = await Task.create({
        farm_id,
        assigned_by: user._id,
        title,
        description,
        date: new Date(date),
        assignments: worker_ids.map((worker_id) => ({ worker_id, status: 'pending' })),
    })

    await task.populate([
        POPULATE_ASSIGNEE,
        POPULATE_ASSIGNER
    ]);


    return task
}

export const getTasksService = async (farm_id, reqQuery) => {
    const { date, worker_id, status, page = 1, limit= 50 } = reqQuery;
    const skip = (page - 1) * limit;

    const query = { farm_id }

    if(worker_id) query['assignments.worker_id'] = worker_id;
    if(status) query.status = status;

    if(date) {
        const d = new Date(date);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        query.date = {$gte: d, $lt: nextDay };
    }

    const [total, tasks] = await Promise.all([
        Task.countDocuments(query),
        Task.find(query)
          .skip(skip)
          .sort({
            date: -1,
            createdAt: -1
          })
          .limit(limit)
          .populate(POPULATE_ASSIGNEE)
          .populate(POPULATE_ASSIGNER)
          .lean()
    ])


    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    }



    return {
        pagination,
        tasks
    }
}

export const getMyTasksService = async (farm_id, worker_id, reqQuery) => {
    const { date, status, page = 1, limit = 50 } = reqQuery;
    const skip = (page - 1) * limit;

    const query = { farm_id };

    if (status) {
        query.assignments = { $elemMatch: { worker_id, status } };
    } else {
        query['assignments.worker_id'] = worker_id;
    }

    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: d, $lt: nextDay };
    }


    const [total, tasks] = await Promise.all([
        Task.countDocuments(query),
        Task.find(query)
          .skip(skip)
          .sort({
            date: -1,
            createdAt: -1
          })
          .limit(limit)
          .populate(POPULATE_ASSIGNEE)
          .populate(POPULATE_ASSIGNER)
    ])

    const shaped = tasks.map((t) => ({
        ...t.toObject(),
        my_assignment: t.assignmentFor(worker_id)
    }))

    const pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
    }

    return {
        pagination,
        shaped
    }
}

export const updateMyTaskStatusService = async (farm_id, worker_id, task_id, { status }) => {

    if(!worker_id) {
        const error = new Error('This account is not linked to a worker record');
        error.statusCode = 403;
        throw error;
    }

    const task = await Task.findOne({
        _id: task_id,
        farm_id,
        'assignments.worker_id': worker_id
    })

    if (!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error
    }

    const assignment = task.assignmentFor(worker_id);

    assignment.status = status;

    assignment.completed_at = status === 'done' ? new Date(): null;
    task.recomputeStatus();

    await task.save();
    await task.populate([
        POPULATE_ASSIGNEE,
        POPULATE_ASSIGNER
    ]);

    return {
        ...task.toObject(),
        my_assignment: task.assignmentFor(worker_id)
    }
}

export const getTasksByWorkerService = async (farm_id, worker_id, reqQuery) => {
    const { month, year, status } = reqQuery;

    const query = {
        farm_id,
        'assignments.worker_id': worker_id
    }

    if(month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        query.date = { $gte: start, $lt: end };
    }

    let tasks = await Task.find(query)
        .sort({ date: -1 })
        .populate(POPULATE_ASSIGNER)

    if(status) {
        tasks = tasks.filter((t) => t.assignmentFor(worker_id)?.status === status);
    }

    const shaped = tasks.map((t) => ({
        ...t.toObject(),
        my_assignment: t.assignmentFor(worker_id)
    }))

    return shaped
}

export const updateAssignmentStatusService = async (farm_id, { id, worker_id }, { status }) => {
    const task = await Task.findOne({
        _id: id,
        farm_id,
        'assignments.worker_id': worker_id
    });

    if(!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    };

    const assignment = task.assignmentFor(worker_id);
    assignment.status = status;
    assignment.completed_at = status === 'done' ? new Date() : null;
    task.recomputeStatus();

    await task.save();
    await task.populate([POPULATE_ASSIGNEE, POPULATE_ASSIGNER]);

    return task
}

export const rateAssignmentService = async (farm_id, { id, worker_id }, { rating, note }) => {
    const task = await Task.findOne({
        _id: id,
        farm_id,
        'assignments.worker_id': worker_id
    });

    if(!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    const assignment = task.assignmentFor(worker_id);
    assignment.rating = rating;

    if(note !== undefined) assignment.note = note;
    await task.save();
    await task.populate([POPULATE_ASSIGNEE, POPULATE_ASSIGNER]);

    return task
}

export const addAssigneesService = async (farm_id, reqBody, task_id, user) => {
    const { worker_ids: rawWorkerIds } = reqBody;
    const worker_ids = [...new Set(rawWorkerIds.map(String))];

    const task = await Task.findOne({
        _id: task_id,
        farm_id
    });

    if(!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }

    const workers = await Worker.find({
        _id: { $in: worker_ids },
        farm_id
    });

    if(workers.length !== worker_ids.length) {
        const error = new Error("One or more workers were not found on this farm");
        error.statusCode = 404;
        throw error;
    }

    const existing = new Set(task.assignments.map((a) => String(a.worker_id)));
    const toAdd = worker_ids.filter((id) => !existing.has(String(id)));

    const workersToAdd = workers.filter((w) => toAdd.some((id) => String(id) === String(w._id)));

    const { unauthorized } = await authorizeWorkersForTask(workersToAdd, user);

    if(unauthorized.length > 0) {
        const error = new Error('You do not supervise these workers');
        error.statusCode = 403;
        error.unauthorized_worker_ids = unauthorized;

        throw error;
    }

    toAdd.forEach((worker_id) => task.assignments.push({ worker_id, status: 'pending' }));
    task.recomputeStatus();
    await task.save();
    await task.populate([
        POPULATE_ASSIGNEE,
        POPULATE_ASSIGNER
    ]);

    return task
}

export const removeAssigneeService = async (farm_id, reqParams) => {

    const { id, worker_id } = reqParams;

    const task = await Task.findOne({
        _id: id,
        farm_id
    });

    if(!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    };

    if(!task.assignmentFor(worker_id)) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    };

    if(task.assignments.length <= 1) {
        const error = new Error('Cannot remove the last worker — delete the task instead');
        error.statusCode = 400;
        throw error;
    };

    task.assignments = task.assignments.filter((a) => String(a.worker_id) !== String(worker_id));
    task.recomputeStatus();
    await task.save();
    await task.populate([
        POPULATE_ASSIGNEE,
        POPULATE_ASSIGNER
    ]);


    return task
}

export const deleteTaskService = async (farm_id, task_id) => {
    const task = await Task.findOneAndDelete({
        _id: task_id,
        farm_id
    });

    if(!task) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
    }



    return task_id
}
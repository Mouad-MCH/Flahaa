import User from "../models/User.js";
import Worker from "../models/Worker.js";
import { buildWorkerScope } from "../utils/workerScope.js";

const assertActiveSupervisor = async (supervisorId, farmId) => {
    const supervisor = await User.findOne({
        _id: supervisorId,
        farm_id: farmId,
        role: 'supervisor',
        status: 'active'
    });

    if(!supervisor) {
        const error = new Error('Supervisor not found, inactive, or not on this farm');
        error.statusCode = 404;
        throw error;
    }
}

export const createWorkerService = async (workerData, farm_id, user) => {

    const { name, CIN, phone, address, avatar, contract_type, daily_rate, status, join_date, supervisor_id } = workerData;
    const existingWorker = await Worker.findOne({
        farm_id,
        CIN
    });

    if(existingWorker) {
        const error = new Error(`A worker with CIN '${CIN}' already exists on this farm.`);
        error.statusCode = 400;
        throw error;
    }

    const resolvedSupervisorId = user.role === 'admin' ? (supervisor_id || null) : user._id;

    if(user.role === 'admin' && resolvedSupervisorId) {
        await assertActiveSupervisor(resolvedSupervisorId, farm_id);
    }

    const worker = await Worker.create({
      farm_id,
      name,
      CIN,
      phone,
      address,
      avatar,
      contract_type,
      daily_rate,
      status,
      join_date: join_date ? new Date(join_date) : undefined,
      supervisor_id: resolvedSupervisorId
    });


    return worker;
}

export const listWorkersService = async (farmId, { status, search,  page, limit }, user) => {
    const query = buildWorkerScope(farmId, user);
    if(status) query.status = status;
    if(search) query.name = { $regex: search, $options: "i" }

    const skip = (parseInt(page) - 1) * parseInt(limit);


    const [workers, total] = await Promise.all([
        Worker.find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 })
          .populate({ path: "supervisor_id", select: "name" })
          ,
        Worker.countDocuments(query)
    ])


    return {
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
        },
        workers
    }
}

export const getWorkerService = async (workerId, farmId, user) => {

    const query = { ...buildWorkerScope(farmId, user), _id: workerId };
    const worker = await Worker.findOne(query).populate({ path: "supervisor_id", select: "name" });

    if(!worker) {
        const error = new Error('Worker not found or not accessible');
        error.statusCode = 404;
        throw error
    }

    return worker
}

export const updateWorkerService = async (workerId, farmId, Data, user) => {
    const {
        name,
        CIN,
        phone,
        address,
        avatar,
        contract_type,
        daily_rate,
        status,
        join_date,
        supervisor_id
    } = Data;


    const scopedQuery = { ...buildWorkerScope(farmId, user), _id: workerId };
    let worker = await Worker.findOne(scopedQuery);

    if(!worker) {
        const error = new Error("Worker not found or not accessible");
        error.statusCode = 404;
        throw error
    }

    if(CIN && CIN !== worker.CIN) {
        const existingWorker = await Worker.findOne({ farm_id: farmId, CIN });
        if(existingWorker) {
            const error = new Error(`A worker with CIN '${CIN}' already exists on this farm.`);
            error.statusCode = 400;
            throw error
        }
    }

    const resolvedSupervisorId = user.role === "admin" ? (supervisor_id === '' ? null : supervisor_id) : undefined;

    if(user.role === 'admin' && supervisor_id !== undefined && resolvedSupervisorId) {
        await assertActiveSupervisor(resolvedSupervisorId, farmId);
    }

    const updateData = {
      name,
      CIN,
      phone,
      address,
      avatar,
      contract_type,
      daily_rate,
      status,
      join_date: join_date ? new Date(join_date) : undefined,
      supervisor_id: resolvedSupervisorId
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    worker = await Worker.findOneAndUpdate(scopedQuery, updateData, {
        new: true,
        runValidators: true
    }).populate({
        path: 'supervisor_id',
        select: 'name'
    })


    return worker
}

export const deleteWorkerService = async (workerId, farmId, user) => {

    const query = { ...buildWorkerScope(farmId, user), _id: workerId };
    const worker = await Worker.findOneAndDelete(query);

    if(!worker) {
        const error = new Error('Worker not found or not accessible');
        error.statusCode = 404;
        throw error;
    }

    return workerId
}

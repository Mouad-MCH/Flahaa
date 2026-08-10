import Worker from "../models/Worker.js";

export const createWorkerService = async (workerData, farm_id, role) => {
    
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
      supervisor_id: role === 'admin' ? (supervisor_id || null) : null
    });


    return worker;
}

export const listWorkersService = async (farmId, { status, search,  page, limit }) => {
    const query = { farm_id: farmId};
    if(status) query.status = status;
    if(search) query.name = { $regex: search, $options: "i" }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    
    const [workers, total] = await Promise.all([
        Worker.find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ created: -1 })
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

export const getWorkerService = async (workerId, farmId) => {

    const worker = await Worker.findOne({ _id: workerId, farm_id: farmId }).populate({ path: "supervisor_id", select: "name" });

    if(!worker) {
        const error = new Error('Worker not found on this farm');
        error.statusCode = 404;
        throw error
    }

    return worker
}

export const updateWorkerService = async (workerId, farmId, Data, role) => {
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


    let worker = await Worker.findOne({_id: workerId, farm_id: farmId});

    if(!worker) {
        const error = new Error("Worker not found on this farm");
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
      supervisor_id: role === "admin" ? (supervisor_id === '' ? null : supervisor_id) : undefined
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    worker = await Worker.findByIdAndUpdate(workerId, updateData, {
        new: true,
        runValidators: true
    }).populate({
        path: 'supervisor_id',
        select: 'name'
    })


    return worker
}

export const deleteWorkerService = async (workerId, farm_id) => {

    const worker = await Worker.findOneAndDelete({ _id: workerId, farm_id });

    if(!worker) {
        const error = new Error('Worker not found on this farm');
        error.statusCode = 404;
        throw error;
    }

    return workerId
}
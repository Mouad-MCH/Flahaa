
import { createWorkerService, listWorkersService, getWorkerService, updateWorkerService, deleteWorkerService } from "../services/worker.service.js";


export const createWorkerController = async (req, res, next) => {
    try {
        const newWorker = await createWorkerService(req.body, req.scopedFarmId, req.user);

        res.status(201).json({
            status: true,
            statusCode: 201, 
            data: { worker: newWorker }
        });


    } catch (error) {
        next(error)
    }
}

export const listWorkersController = async (req, res, next) => {
    try {
        const workers = await listWorkersService(req.scopedFarmId, req.query, req.user);

        res.status(200).json({
            status: true,
            statusCode: 200,
            data: { ...workers }
        });
    } catch (error) {
        next(error)
    }
}

export const getWorkerController = async (req, res, next) => {
    try {
        const worker = await getWorkerService(req.params.id, req.scopedFarmId, req.user);

        res.status(200).json({
            status: true,
            statusCode: 200,
            data: { worker }
        })

    }catch(error) {
        next(error)
    }
}

export const updateWorkerController = async (req, res, next) => {
    try {
        const workerUpdated = await updateWorkerService(req.params.id, req.scopedFarmId, req.body, req.user);

        res.status(200).json({
            status: true,
            data: workerUpdated
        });

    }catch(error) {
        next(error)
    }
}

export const deleteWorkerController = async (req, res, next) => {
    try {
        await deleteWorkerService(req.params.id, req.scopedFarmId, req.user);

        res.status(200).json({
            status: true,
            message: 'Worker deleted successfully'
        })
    }catch(error) {
        next(error)
    }
} 
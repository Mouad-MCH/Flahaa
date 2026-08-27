import { 
    createTaskService, 
    getTasksService, 
    getMyTasksService, 
    rateAssignmentService, 
    removeAssigneeService, 
    deleteTaskService, 
    updateAssignmentStatusService, 
    addAssigneesService,
    getTasksByWorkerService,
    updateMyTaskStatusService 
} from "../services/task.service.js";



export const createTaskController = async (req, res, next) => {
    try {
        const task = await createTaskService(req.scopedFarmId, req.user, req.body);

        res.status(201).json({
            status: true,
            data: task
        })

    } catch(error) {
        next(error)
    }
}

export const getTasksController = async (req, res, next) => {
    try {
        const { pagination, tasks } = await getTasksService(req.scopedFarmId, req.query);


        res.status(200).json({
            status: true,
            pagination,
            data: tasks
        })

    } catch(error) {
        next(error)
    }
}

export const getMyTasksController = async (req, res, next) => {
    try {

        const { pagination, shaped } = await getMyTasksService(req.user.farm_id, req.user.worker_id, req.query);

        res.status(200).json({
            status: true,
            pagination,
            data: shaped
        })

    } catch(error) {
        next(error)
    }
}

export const updateMyTaskStatusController = async (req, res, next) => {
    try {
        const task = await updateMyTaskStatusService(req.user.farm_id, req.user.worker_id, req.params.id, req.body);

        res.status(200).json({
            status: true,
            data: task
        })


    } catch(error) {
        next(error)
    }
}

export const getTasksByWorkerController = async (req, res, next) => {
    try {

        const shaped = await getTasksByWorkerService(req.scopedFarmId, req.params.worker_id, req.query);

        res.status(200).json({
            status: true,
            data: shaped
        })

    } catch(error) {
        next(error)
    }
}

export const updateAssignmentStatusController = async (req, res, next) => {
    try {
        const task = await updateAssignmentStatusService(req.scopedFarmId, req.params, req.body);

        res.status(200).json({
            status: true,
            data: task
        })
    } catch (error) {
        next(error)
    }
}

export const rateAssignmentController = async (req, res, next) => {
    try {
        const task = await rateAssignmentService(req.scopedFarmId, req.params, req.body);

        res.status(200).json({
            status: true,
            data: task
        })

    } catch (error) {
        next(error)
    }
}

export const addAssigneesController = async (req, res, next) => {
    try {
        const task = await addAssigneesService(req.scopedFarmId, req.body, req.params.id, req.user);

        res.status(201).json({
            status: true,
            data: task
        })
    } catch(error) {
        next(error)
    }

}

export const removeAssigneeController = async (req, res, next) => {
    try {
        const task = await removeAssigneeService(req.scopedFarmId, req.params);

        res.status(200).json({
            status: true,
            data: task
        })
    } catch (error) {
        next(error)
    }
}

export const deleteTaskController = async (req, res, next) => {
    try {
        await deleteTaskService(req.scopedFarmId, req.params.id);

        res.status(200).json({
            status: true,
            message: "Task deleted successfully",
        })
    } catch (error) {
        next(error)
    }
}

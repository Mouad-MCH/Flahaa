import { createAttendanceService, bulkCreateAttendanceService, getAttendanceByDateService, getWorkerAttendanceService, getMonthlySummaryService } from "../services/attendance.service.js";



export const createAttendanceController = async (req, res, next) => {
    try {
        const attendance = await createAttendanceService(req.scopedFarmId, req.body, req.user._id);

        res.status(201).json({
            status: true,
            data: attendance
        });
    } catch(error) {
        next(error)
    }
}

export const bulkCreateAttendanceController = async (req, res, next) => {
    try {
        const attendance = await bulkCreateAttendanceService(req.scopedFarmId, req.body, req.user._id);

        res.status(201).json({
            status: true,
            data: {  ...attendance }
        })

    } catch(error) {
        next(error)
    }
}

export const getAttendanceByDateController = async (req, res, next) => {
    try {
        const attendance = await getAttendanceByDateService(req.scopedFarmId, req.query);

        res.status(200).json({
            status: true,
            data: {
                ...attendance
            }
        })

    } catch(error) {
        next(error)
    }
}

export const getWorkerAttendanceController = async (req, res, next) => {
    try {
        const workerAttendance = await getWorkerAttendanceService(req.scopedFarmId, req.params.id, req.query);

        res.status(200).json({
            status: true,
            data: {
                worker_id: req.params.id,
                ...workerAttendance
            }
        })

    } catch(error) {
        next(error)
    }
}

export const getMonthlySummaryController = async (req, res, next) => {
    try {

        const buckets = await getMonthlySummaryService(req.scopedFarmId, req.query.months)


        res.status(200).json({
            status: true,
            data: buckets,
        })


    } catch(error) {
        next(error)
    }
}
import { 
    calculatePayrollService, 
    getPayrollsService,
    getPayrollByWorkerService,
    updatePayrollStausService,
    getMyPayrollsService 
} from '../services/pyroll.service.js'


export const calculatePayrollController = async (req, res, next) => {
    try {

        const payroll = await calculatePayrollService(req.scopedFarmId, req.body);


        res.status(200).json({
            status: true,
            data: payroll
        })

    } catch(error) {
        next(error)
    }
}

export const getPayrollsController = async (req, res, next) => {
    try {

        const { pagination, records } = await getPayrollsService(req.scopedFarmId, req.query);

        res.status(200).json({
            status: true,
            pagination,
            data: records
        })

    } catch (error) {
        next(error)
    }
}

export const getPayrollByWorkerController = async (req, res, next) => {
    try {
        const payroll = await getPayrollByWorkerService(req.scopedFarmId, req.params);

        res.status(200).json({
            status: true,
            data: payroll,
        })

    } catch(error) {
        next(error)
    }
}

export const updatePayrollStatusController = async (req, res, next) => {
    try {
        const payroll = await updatePayrollStausService(req.scopedFarmId, req.params.id, req.body);

        res.status(200).json({
            status: true,
            data: payroll
        })

    } catch(error) {
        next(error)
    }
}

export const getMyPayrollsController = async (req, res, next) => {
    try {
        const { pagination, records } = await getMyPayrollsService(req.user, req.query);

        res.status(200).json({
            status: true,
            pagination,
            data: records,
        })

    } catch(error) {
        next(error)
    }
}

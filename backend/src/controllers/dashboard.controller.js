import { getDashboardService } from "../services/dashboard.service.js"



export const getDashboardController = async (req, res, next) => {
    try {

        const dashboard = await getDashboardService(req.scopedFarmId, req.user);

        res.status(200).json({
            status: true,
            data: dashboard
        })

    } catch(error) {
        next(error)
    }
}
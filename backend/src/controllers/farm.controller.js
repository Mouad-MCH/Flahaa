import { createFarmService , getMyFarmsService} from "../services/farm.service.js";



export const createFarmController = async (req, res, next) => {
    try {

        const farm = await createFarmService(req.body, req.user._id);

        res.status(201).json({ success: true, data: farm });

    } catch (error) {
        next(error);
    }
}


export const getMyFarmsController = async (req, res, next) => {
    try {
        const farms = await getMyFarmsService(req.user._id);

        res.status(200).json({ success: true, data: farms });
    } catch (error) {
        next(error);
    }
}
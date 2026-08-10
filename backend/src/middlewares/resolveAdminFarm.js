import Farm from '../models/Farm.js'

export const resolveAdminFarm = async (req, res, next) => {
    if(req.user.role !== "admin") {
        req.scopedFarmId = req.user.farm_id;
        return next()
    };

    try {
        const farmId = req.query.farm_id || req.params.farmId;

        if (!farmId) {
            const error = new Error('farm_id query parameter is required for admin requests');
            error.statusCode = 400;
            throw error; 
        }

        const farm = await Farm.findOne({
            _id: farmId,
            owner_id: req.user._id
        })

        if(!farm) {
            const error = new Error('Farm not found or not yours');
            error.statusCode = 403;
            throw error
        }

        req.scopedFarmId = farm._id;
        next();

    }catch(error) {
        next(error)
    }
} 
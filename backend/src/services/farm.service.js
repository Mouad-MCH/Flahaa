import Farm from '../models/Farm.js';



export const createFarmService = async (farmData, ownerId) => {
    const { name, address } = farmData;

    const farm = await Farm.create({ name, address, owner_id: ownerId });

    return farm;
}

export const getMyFarmsService = async (ownerId) => {

    const farms = await Farm.find({ owner_id: ownerId });

    if (!farms) {
        const error = new Error('No farms found for the logged-in admin');
        error.statusCode = 404;
        throw error;
    }

    return farms;
}
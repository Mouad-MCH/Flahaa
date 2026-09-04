import User from '../models/User.js';
import Worker from '../models/Worker.js';
import { generateTempPassword, hashPassword } from '../utils/password.js';
import mongoose from 'mongoose';


export const getSupervisorsService = async (farmId) => {

    const supervisors = await User.find({ farm_id: farmId, role: 'supervisor' }).select('-password');

    return supervisors;
}

export const createSupervisorService = async (data, farmId) => {
    const { name, email, phone } = data;

    const existing = await User.findOne({ email });
    if (existing) {
        const error = new Error('A user with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    const supervisor = await User.create(
        { 
            name, 
            email, 
            phone, 
            password: hashedPassword, 
            role: 'supervisor', 
            farm_id: farmId 
        }
    );

    return { supervisor, tempPassword };
}

export const getSupervisorByIdService = async (supervisorId, farmId) => {

    const supervisor = await User.findOne(
        {
            _id: supervisorId,
            farm_id: farmId,
            role: 'supervisor'
        }
    ).select('-password')

    if(!supervisor) {
        const error = new Error('Supervisor not found on this farm');
        error.statusCode = 404;
        throw error;
    }

    const farmObjectId = new mongoose.Types.ObjectId(farmId);
    const supervisorObjectId = new mongoose.Types.ObjectId(supervisorId);


    const [ workerStats ] = await Worker.aggregate([
        {
            $match: {
                farm_id: farmObjectId,
                supervisor_id: supervisorObjectId
            }
        },

        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                active: { 
                    $sum: {
                        $cond: [
                            { $eq: ['$status', 'active'] },
                            1,
                            0
                        ]
                    }
                 }
            }
        }
    ]);


    const workers = await Worker.find({ farm_id: farmObjectId, supervisor_id: supervisorObjectId }).select('-password');




    return { 
        supervisor,
        workerStats: {
            total: workerStats ? workerStats.total : 0,
            active: workerStats ? workerStats.active : 0
        },
        workers
    };
}

export const deleteSupervisorService = async (supervisorId, farmId) => {

    const supervisor = await User.findOneAndUpdate(
        {
            _id: supervisorId,
            farm_id: farmId,
            role: 'supervisor'
        },
        { status: 'inactive' },
        { new: true }
    );

    if(!supervisor) {
        const error = new Error('Supervisor not found on this farm');
        error.statusCode = 404;
        throw error;
    }

    return supervisor;
}

export const updateSupervisorService = async (supervisorId, farmId, data) => {

    if(data.email) {
        const existing = await User.findOne({ email: data.email, _id: { $ne: supervisorId } });
        if (existing) {
            const error = new Error('A user with this email already exists');  
            error.statusCode = 400;
            throw error;
        }
    }

    const supervisor = await User.findOneAndUpdate(
        {
            _id: supervisorId,
            farm_id: farmId,
            role: 'supervisor'
        },
        data,
        { new: true, runValidators: true }
    );

    if(!supervisor) {
        const error = new Error('Supervisor not found on this farm');
        error.statusCode = 404;
        throw error;
    }

    return supervisor;
}
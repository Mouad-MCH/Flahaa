import Farm from "../models/Farm.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import { comparPasword, hashPassword } from "../utils/password.js";
import { generateRefreshToken, generateToken } from "../utils/token.js";


export const registerService = async (data) => {
    const { name, email, phone, password, role, farm_name, farm_id, CIN } = data;

    const userExists = await User.findOne({ email });
    if(userExists) {
        const error = new Error('Email is already registered');
        error.statusCode = 409;
        throw error
    };

    const hashedPassword = await hashPassword(password);

    if(role === "admin") {
        if(!farm_name) {
            const error = new Error('farm_name is required to register as admin');
            error.statusCode = 400;
            throw error
        }

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            farm_id: null,
        })

        const farm = await Farm.create({
            name: farm_name,
            owner_id: user._id
        });

        return { user, farm } 
    }

    if(role === 'supervisor') {
        if(!farm_id) {
            const error = new Error('farm_id is required to register as supervisor');
            error.statusCode = 400;
            throw error
        };

        const farmExists = await Farm.findById(farm_id);
        if(!farmExists) {
            const error = new Error('Farm not found');
            error.statusCode = 404;
            throw error;
        }

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            farm_id: farmExists._id
        });

        return { user, farm: farmExists }
    }

    if(role === 'worker') {
        // don't fourgot add this validation on registerSchema on zod validation 
        //this condition just to make validation work intel add it to registerSchema
        if(!farm_id || !CIN) {
            const error = new Error('farm_id and CIN are required to register as worker');
            error.statusCode = 400;
            throw error;
        }

        const worker = await Worker.findOne({ farm_id, CIN });
        if(!worker) {
            const error = new Error('No worker record found with this CIN on this farm. Ask your admin to register you first.');
            error.statusCode = 404;
            throw error;
        }

        const workerAlreadyLinked = await User.findOne({ worker_id: worker._id });
        if(workerAlreadyLinked) {
            const error = new Error('This worker already has an account');
            error.statusCode = 409;
            throw error;
        }

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            farm_id,
            worker_id: worker._id
        });

        const farm = await Farm.findById(farm_id);

        return { user, worker, farm }
    }


  const error = new Error('Invalid role');
  error.statusCode = 400;
  throw error;
}

export const loginService = async (data) => {
    const { email, password } = data;

    const userExists = await User.findOne({ email }).select('+password');
    if(!userExists) {
        const error = new Error("User not Fount");
        error.statusCode = 401;
        throw error
    };

    const matchPassword = await comparPasword(password, userExists.password);

    if(!matchPassword) {
        const error = new Error("Invalid password or email ");
        error.statusCode = 401;
        throw error;
    };

    const farm = await Farm.findById(userExists.farm_id).select('name');

    const accessToken = generateToken(userExists);
    const refreshToken = generateRefreshToken(userExists);

    return { user: userExists, accessToken, refreshToken, farm }
}
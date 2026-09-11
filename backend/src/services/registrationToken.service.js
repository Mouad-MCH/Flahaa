import Farm from "../models/Farm.js"
import crypto from 'crypto'
import RegistrationToken from "../models/RegistrationToken.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";



export const createRegistrationTokenService = async (farm_id, role, creator, worker_id, email, name) => {

    if(!["supervisor" , "worker"].includes(role)) {
        const error = new Error("Invalid registration role");
        error.statusCode = 400;
        throw error;
    }
    
    const farm = await Farm.findById(farm_id);

    if(!farm) {
        const error = new Error('Farm not Found');
        error.statusCode = 404;
        throw error
    }

    const isAdmin = creator.role === "admin";
    const isSupervisor =
          creator.role === "supervisor" &&
          creator.farm_id?.toString() === farm._id.toString();


    if(!isAdmin && !(isSupervisor && role === "worker")) {
        const error = new Error("You are not authorized to create this registration token");
        error.statusCode = 403;
        throw error;
    }

    if(isAdmin && farm.owner_id.toString() !== creator._id.toString()) {
        const error = new Error( "You are not authorized to create a token for this farm");
        error.statusCode = 403;
        throw error;
    }

    const existingEmailUser = await User.findOne({ email });

    if(existingEmailUser) {
        const error = new Error(
            "A user with this email already exists"
        );
        error.statusCode = 409;
        throw error;
    }

    let registerTokenData = { email }

    let invitationName = name;

    if(role === "worker") {

        if(!worker_id) {
            const error = new Error("Worker ID is required");
            error.statusCode = 400;
            throw error;
        }

        const wokrerExist = await Worker.findOne({ _id: worker_id, farm_id, status: "active" })
        if(!wokrerExist) {
            const error = new Error('worker not found');
            error.statusCode = 404;
            throw error
        }

        invitationName = wokrerExist.name;

        const existingUser = await User.findOne({
            worker_id: wokrerExist._id
        });

        if(existingUser) {
            const error = new Error("This worker already has a user account");
            error.statusCode = 400;
            throw error;
        }

        registerTokenData.worker_id = wokrerExist._id
    }

    if(role === "supervisor") registerTokenData.name = name;

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");


    const registrationToken  = await RegistrationToken.create({
        tokenHash,
        farm_id,
        role,
        email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxUses: 1,
        createdBy: creator._id,
        ...registerTokenData
    });


    return {
        rawToken,
        registrationToken,
        farm,
        invitationName
    }
}

export const getRegistrationTokenInfoService = async (rawToken) => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const registrationToken = await RegistrationToken.findOne({
        tokenHash
    });

    if (!registrationToken) {
        const error = new Error("Invalid registration token");
        error.statusCode = 404;
        throw error;
    }

    if (registrationToken.expiresAt <= new Date()) {
        const error = new Error("Registration token has expired");
        error.statusCode = 401;
        throw error;
    }

    if (registrationToken.usedCount >= registrationToken.maxUses) {
        const error = new Error("Registration token has already been used");
        error.statusCode = 409;
        throw error;
    }

    const farm = await Farm.findById(registrationToken.farm_id);

    if (!farm) {
        const error = new Error("Farm not found");
        error.statusCode = 404;
        throw error;
    }

    let name = registrationToken.name;

    if (registrationToken.role === "worker") {
        const worker = await Worker.findOne({
            _id: registrationToken.worker_id,
            farm_id: registrationToken.farm_id
        });

        if (!worker) {
            const error = new Error(
                "Worker associated with this invitation was not found"
            );
            error.statusCode = 404;
            throw error;
        }

        name = worker.name;
    }

    return {
        name,
        email: registrationToken.email,
        role: registrationToken.role,
        farm_name: farm.name,
        expiresAt: registrationToken.expiresAt,
    };
};
import { ENV } from "../config/env.js";
import { loginService, registerService } from "../services/auth.service.js";
import { cookieOptions, generateRefreshToken, generateToken } from "../utils/token.js";

export const registerController = async (req, res, next) => {
    try {
        const newUser = await registerService(req.body);
        const { user, farm } = newUser;

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        const resolvedFarmName = farm ? farm.name : null;

        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.status(201).json({
            status: true,
            statusCode: 201,
            data: {
              token: accessToken,
              user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                farm_id: user.farm_id,
                farm_name: resolvedFarmName,
                worker_id: user.worker_id
              }
            }
        });

    }catch(error) {
        next(error)
    }
}

export const loginController = async (req, res, next) => {
    try {

        const loggedUser = await loginService(req.body);
        const { user, accessToken, refreshToken, farm } = loggedUser;

        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.status(200).json({
            status: true,
            data: {
                token: accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    farm_id: user.farm_id,
                    farm_name: farm?.name,
                    worker_id: user.worker_id
                }

            }
        })
        


    } catch(error) {
        next(error)
    }
}

export const logout = async (req, res, next) => {
    try {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: ENV.NODE_ENV === 'production',
            sameSite: 'Strict'
        })

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });

    } catch(error) {
        next(error)
    }
}
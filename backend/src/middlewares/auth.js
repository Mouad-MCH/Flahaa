import jwt from 'jsonwebtoken'
import { ENV } from '../config/env.js'
import User from '../models/User.js';

export const authGuard = async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token) {
        return res.status(401).json({
            status: 'error',
            statusCode: 401,
            message: 'Not authorized to access this resource. No token provided'
        })
    }

    try {
        const decoded = jwt.verify(
            token,
            ENV.JWT_SECRET
        );

        req.user = await User.findById(decoded.id);
        
        if(!req.user) {
            return res.status(401).json({
                status: 'error',
                statusCode: 401,
                message: "User associated with this token no logger exists."
            })
        }

        next()

    } catch(error) {
        return res.status(401).json({
            status: 'error',
            statusCode: 401,
            message: 'Not authorized to access this resource. Invalid token.'
        })
    }

}

export const roleGuard = (...roles) => {
    return (req, res, next) => {
        if(!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                statusCode: 403,
                message: `Role (${req.user ? req.user.role : 'anonymous'}) is not authorized to access this resource.`
            })
        }

        next();
    }
}
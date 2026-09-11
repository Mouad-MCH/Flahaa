import JWT from 'jsonwebtoken'
import { ENV } from '../config/env.js'


export const generateToken = (user) => {
    return JWT.sign(
        {
            id: user._id,
            role: user.role
        },
        ENV.JWT_SECRET,
        {
            expiresIn: ENV.JWT_EXPIRES_IN
        }
    )
}


export const verifyToken = (token) => {
    return JWT.verify(token, ENV.JWT_SECRET)
}


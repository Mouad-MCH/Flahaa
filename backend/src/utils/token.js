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

export const generateRefreshToken = (user) => {
    return JWT.sign(
        { 
            id: user._id,
            role: user.role
        },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }
    )
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
};
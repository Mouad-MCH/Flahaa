import bcrypt from 'bcrypt';
import { ENV } from '../config/env.js';
import crypto from 'crypto';


export const hashPassword = async (password) => {
    return await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
}

export const comparPasword = async (candidatePassword, password) => {
    const comparPassword = await bcrypt.compare(candidatePassword, password)
    return comparPassword
}


export const generateTempPassword = () => {
    return crypto.randomBytes(8).toString('hex');
}
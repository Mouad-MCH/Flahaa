import bcrypt from 'bcrypt';
import { ENV } from '../config/env.js';


export const hashPassword = async (password) => {
    return await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
}

export const comparPasword = async (candidatePassword, password) => {
    const comparPassword = await bcrypt.compare(candidatePassword, password)
    return comparPassword
}
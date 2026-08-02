import mongoose from "mongoose";
import { ENV } from './env.js'

const MONGODB_URI = ENV.MONGODB_URI

export const connectDB = async () => {
    try {

        const conn  = await mongoose.connect(MONGODB_URI);
        console.log(`DATABASE connected successfully: ${conn.connection.host}`)

    }catch(err) {
        console.error("DATABASE not connect", err)
    }
}
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';


export const isConfigured = 
   ENV.CLOUDINARY_CLOUD_NAME &&
   ENV.CLOUDINARY_CLOUD_NAME !== 'mock';


if(isConfigured) {
    cloudinary.config({
        cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
        api_key: ENV.CLOUDINARY_API_KEY,
        api_secret: ENV.CLOUDINARY_API_SECRET
    })
}

export { cloudinary }

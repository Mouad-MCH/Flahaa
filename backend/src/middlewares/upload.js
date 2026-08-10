import { cloudinary, isConfigured } from '../config/cloudinary.js'
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLocaleLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, and WEBP image uploads are allowed'));
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
})

export const uploadAvatar = async (req, res, next) => {
    if(!req.file) {
        return next();
    }

    try {
        if(isConfigured) {
            const uploadStream = cloudinary.uploader.upload_stream(
                 {
                   resource_type: "image",
                   folder:"flahaa_avatars"
                 },
               (error, result) => {
                 if (error) {
                   return next(new Error(`Cloudinary Upload Error: ${error.message}`));
                 }
                 req.body.avatar = result.secure_url;
                 next();
               }
             );

            uploadStream.end(req.file.buffer);
        }else {
            const uploadDir = path.join(__dirname, '../../public/uploads');
            if(!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `avatar-${Date.now()}${path.extname(req.file.originalname)}`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, req.file.buffer);

            req.body.avatar = `/uploads/${fileName}`;
            next();
        }

    }catch(error) {
        next(error)
    }
} 

export const uploadSingle = upload.single('avatar');
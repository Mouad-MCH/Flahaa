import express from 'express';
import { loginController, registerController, logout } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validation.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';


const router = express.Router();

router.post('/register', validateBody(registerSchema), registerController);
router.post('/login', validateBody(loginSchema), loginController);
router.post('/logout', logout)



export default router;
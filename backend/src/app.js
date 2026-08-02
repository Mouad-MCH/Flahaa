import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';


import AuthRoutes from './routes/auth.routes.js';
import { errorHandler, notFound } from './middlewares/errHandler.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});


app.use('/api/auth', AuthRoutes);

app.use(notFound);
app.use(errorHandler);



export default app;
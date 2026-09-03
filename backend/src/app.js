import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';


import AuthRoutes from './routes/auth.routes.js'
import WorkerRoutes from './routes/worker.routes.js'
import AttendanceRoutes from './routes/attendance.routes.js'
import TasksRouter from './routes/task.routes.js'
import PayrollRouter from './routes/payroll.routes.js'
import FarmRoutes from './routes/farm.routes.js'

import { errorHandler, notFound } from './middlewares/errHandler.js';
import { swaggerSpec } from './config/swagger.js';


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


app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api-docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', AuthRoutes);
app.use('/api/workers',  WorkerRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/tasks', TasksRouter);
app.use('/api/payrolls', PayrollRouter);
app.use('/api/farms', FarmRoutes);


app.use(notFound);
app.use(errorHandler);



export default app;
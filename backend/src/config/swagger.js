import swaggerJsdoc from 'swagger-jsdoc';
import { ENV } from './env.js';

const PORT = ENV.PORT || 3030;

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Flahaa API',
    version: '1.0.0',
    description: 'REST API documentation for the Flahaa farm management backend.',
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Something went wrong' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '664f1c2e5b3c2a0012a3b456' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['admin', 'supervisor', 'worker'], example: 'admin' },
          farm_id: { type: 'string', nullable: true },
          farm_name: { type: 'string', nullable: true },
          worker_id: { type: 'string', nullable: true },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          phone: { type: 'string', example: '0600000000' },
          password: { type: 'string', minLength: 6, format: 'password', example: 'secret123' },
          role: { type: 'string', enum: ['admin', 'supervisor', 'worker'], example: 'admin' },
          farm_name: { type: 'string', description: 'Required when role is admin', example: 'Green Valley Farm' },
          farm_id: { type: 'string', description: 'Required when role is supervisor or worker' },
          CIN: { type: 'string', description: 'Required when role is worker' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', format: 'password', example: 'secret123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          status: { type: 'boolean', example: true },
          statusCode: { type: 'integer', example: 200 },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      Worker: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '664f1c2e5b3c2a0012a3b789' },
          farm_id: { type: 'string' },
          name: { type: 'string', example: 'Ahmed Bennani' },
          CIN: { type: 'string', example: 'AB123456' },
          phone: { type: 'string', example: '0600000000' },
          address: { type: 'string' },
          avatar: { type: 'string', example: '/uploads/avatar-123.jpg' },
          contract_type: { type: 'string', enum: ['daily', 'weekly'], example: 'daily' },
          daily_rate: { type: 'number', example: 120 },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          supervisor_id: { type: 'string', nullable: true },
          join_date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WorkerInput: {
        type: 'object',
        required: ['name', 'CIN', 'daily_rate'],
        properties: {
          name: { type: 'string', minLength: 3, example: 'Ahmed Bennani' },
          CIN: { type: 'string', minLength: 3, example: 'AB123456' },
          phone: { type: 'string', example: '0600000000' },
          address: { type: 'string', example: '12 Rue Atlas, Marrakech' },
          contract_type: { type: 'string', enum: ['daily', 'weekly'], default: 'daily' },
          daily_rate: { type: 'number', minimum: 0.01, example: 120 },
          status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
          join_date: { type: 'string', format: 'date', example: '2026-01-15' },
          supervisor_id: { type: 'string', nullable: true },
          avatar: { type: 'string', description: 'URL of an already-hosted avatar image', example: 'https://res.cloudinary.com/demo/avatar.jpg' },
        },
      },
      WorkerFormInput: {
        type: 'object',
        required: ['name', 'CIN', 'daily_rate'],
        properties: {
          name: { type: 'string', minLength: 3, example: 'Ahmed Bennani' },
          CIN: { type: 'string', minLength: 3, example: 'AB123456' },
          phone: { type: 'string', example: '0600000000' },
          address: { type: 'string', example: '12 Rue Atlas, Marrakech' },
          contract_type: { type: 'string', enum: ['daily', 'weekly'], default: 'daily' },
          daily_rate: { type: 'number', minimum: 0.01, example: 120 },
          status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
          join_date: { type: 'string', format: 'date', example: '2026-01-15' },
          supervisor_id: { type: 'string', nullable: true },
          avatar: { type: 'string', format: 'binary', description: 'Image file (jpeg, jpg, png, webp) up to 5MB' },
        },
      },
      Attendance: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '664f1c2e5b3c2a0012a3b111' },
          worker_id: { type: 'string', example: '664f1c2e5b3c2a0012a3b789' },
          farm_id: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['present', 'absent', 'excused'], example: 'present' },
          check_in: { type: 'string', format: 'date-time', nullable: true },
          check_out: { type: 'string', format: 'date-time', nullable: true },
          recorded_by: { type: 'string', example: '664f1c2e5b3c2a0012a3b456' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AttendanceInput: {
        type: 'object',
        required: ['worker_id', 'date'],
        properties: {
          worker_id: { type: 'string', example: '664f1c2e5b3c2a0012a3b789' },
          date: { type: 'string', example: '2026-08-18' },
          status: { type: 'string', enum: ['present', 'absent', 'excused'], default: 'present' },
          check_in: { type: 'string', format: 'date-time', example: '2026-08-18T07:00:00Z' },
          check_out: { type: 'string', format: 'date-time', example: '2026-08-18T16:00:00Z' },
        },
      },
      BulkAttendanceInput: {
        type: 'object',
        required: ['date', 'records'],
        properties: {
          date: { type: 'string', example: '2026-08-18' },
          records: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['worker_id'],
              properties: {
                worker_id: { type: 'string', example: '664f1c2e5b3c2a0012a3b789' },
                status: { type: 'string', enum: ['present', 'absent', 'excused'], default: 'present' },
                check_in: { type: 'string', format: 'date-time' },
                check_out: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      MonthlyAttendanceSummary: {
        type: 'object',
        properties: {
          year: { type: 'integer', example: 2026 },
          month: { type: 'integer', example: 8 },
          present: { type: 'integer', example: 20 },
          absent: { type: 'integer', example: 2 },
          excused: { type: 'integer', example: 1 },
          total: { type: 'integer', example: 23 },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid authentication token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'User role is not allowed to access this resource',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Request failed validation',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);

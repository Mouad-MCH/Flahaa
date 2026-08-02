import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

 
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }


  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }


  if (statusCode === 500) {
    console.error('[UNHANDLED ERROR]', err);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(ENV.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
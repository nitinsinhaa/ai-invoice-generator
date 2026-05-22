import logger from '../utils/logger.js';
import { ApiResponse } from '../utils/response.js';
import { AppError } from '../errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    code: err.code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.details,
    });
  }

  if (err.name === 'ValidationError') {
    return ApiResponse.badRequest(res, 'Validation error', err.details);
  }

  if (err.code === '23505') {
    return ApiResponse.conflict(res, 'Resource already exists');
  }

  if (err.code === '23503') {
    return ApiResponse.badRequest(res, 'Referenced resource does not exist');
  }

  const isProd = process.env.NODE_ENV === 'production';
  return ApiResponse.serverError(
    res,
    isProd ? 'Internal server error' : err.message || 'Internal server error'
  );
};

export const notFoundHandler = (req, res) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};

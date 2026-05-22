import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/response.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
    
    return ApiResponse.badRequest(res, 'Validation failed', formattedErrors);
  }
  
  next();
};

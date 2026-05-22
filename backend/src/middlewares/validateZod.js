import { AppError } from '../errors/AppError.js';

export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      return next(AppError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    next();
  };

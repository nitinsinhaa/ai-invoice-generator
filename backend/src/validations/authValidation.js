import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('company_name').optional(),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateProfileValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('company_name').optional(),
  body('phone').optional(),
  body('address').optional(),
];

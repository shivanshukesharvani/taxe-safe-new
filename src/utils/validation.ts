/**
 * Validation utilities for request data
 */

import { body, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

/**
 * Validates that answers field is present and is a valid JSON object
 */
export const validateAnswers: ValidationChain[] = [
  body('answers')
    .notEmpty()
    .withMessage('Answers field is required')
    .custom((value) => {
      // If it's already an object, it's valid
      if (typeof value === 'object' && value !== null) {
        return true;
      }
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            return true;
          }
        } catch (e) {
          return false;
        }
      }
      return false;
    })
    .withMessage('Answers must be a valid JSON object')
];

/**
 * Middleware to check validation results
 * Returns 400 if validation fails
 */
export const checkValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw createError(errorMessages, 400);
  }
  next();
};

/**
 * Parses answers field from request
 * Handles both JSON string and object formats
 */
export const parseAnswers = (answers: string | object): object => {
  if (typeof answers === 'string') {
    try {
      return JSON.parse(answers);
    } catch (e) {
      throw createError('Invalid JSON format in answers field', 400);
    }
  }
  return answers;
};


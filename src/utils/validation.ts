import Joi from "joi";

export const cityQuerySchema = Joi.object({
  city: Joi.string().min(2).max(50).required().messages({
    "string.empty": "City is required",
    "string.min": "City must be at least 2 characters",
    "string.max": "City must be less than 50 characters",
    "any.required": "City parameter is required",
  }),
});

// src/utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, statusCode = 503) {
    super(message, statusCode);
  }
}

export class TemporalError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}

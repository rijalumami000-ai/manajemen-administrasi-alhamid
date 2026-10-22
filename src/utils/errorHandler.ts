// errorHandler.ts - Centralized error handling utilities
import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response format
 */
export class AppError extends Error {
  public statusCode: number;
  public details: any;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details: any = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Data') {
    super(`${resource} tidak ditemukan`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Handle async route errors
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 */
export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Log error for debugging
  if (statusCode === 500) {
    console.error('Server Error:', err);
  }

  // Don't expose internal errors to client
  if (!err.isOperational && statusCode === 500) {
    message = 'Terjadi kesalahan pada server';
  }

  return res.status(statusCode).json({
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack })
  });
}

/**
 * Validate required fields
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Field berikut wajib diisi: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

/**
 * Validate field format
 */
export function validateField(
  fieldName: string,
  value: any,
  validator: (val: any) => boolean,
  errorMessage = 'Format tidak valid'
): void {
  if (value && !validator(value)) {
    throw new ValidationError(`${fieldName}: ${errorMessage}`);
  }
}

/**
 * Common validators
 */
export const validators = {
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value: string) => /^(\+62|62|0)[0-9]{9,12}$/.test(value.replace(/[\s-]/g, '')),
  nis: (value: string) => /^[0-9]{6,20}$/.test(value),
  nik: (value: string) => /^[0-9]{16}$/.test(value),
  year: (value: any) => {
    const year = parseInt(value, 10);
    return year >= 1900 && year <= 2100;
  },
  positiveNumber: (value: any) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
  }
};

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any): never {
  // Unique constraint violation
  if (error.code === '23505') {
    throw new ConflictError('Data sudah ada dalam database');
  }

  // Foreign key violation
  if (error.code === '23503') {
    throw new ValidationError('Data terkait tidak ditemukan');
  }

  // Not null violation
  if (error.code === '23502') {
    throw new ValidationError('Field wajib tidak boleh kosong');
  }

  // Re-throw as generic error with actual message for debugging
  throw new AppError(error.message || 'Terjadi kesalahan database', 500, { 
    code: error.code, 
    detail: error.detail,
    hint: error.hint
  });
}

const mod = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
  errorMiddleware,
  validateRequiredFields,
  validateField,
  validators,
  handleDatabaseError
};

module.exports = mod;
export default mod;

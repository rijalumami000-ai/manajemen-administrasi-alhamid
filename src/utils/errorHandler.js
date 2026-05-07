// errorHandler.js - Centralized error handling utilities

/**
 * Standard error response format
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
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
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Data') {
    super(`${resource} tidak ditemukan`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 */
function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Log error for debugging
  if (statusCode === 500) {
    console.error('Server Error:', err);
  }

  // Don't expose internal errors to client
  if (!err.isOperational && statusCode === 500) {
    message = 'Terjadi kesalahan pada server';
  }

  res.status(statusCode).json({
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 && { stack: err.stack })
  });
}

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @throws {ValidationError}
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = [];

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
 * @param {string} fieldName
 * @param {any} value
 * @param {Function} validator
 * @param {string} errorMessage
 * @throws {ValidationError}
 */
function validateField(fieldName, value, validator, errorMessage = 'Format tidak valid') {
  if (value && !validator(value)) {
    throw new ValidationError(`${fieldName}: ${errorMessage}`);
  }
}

/**
 * Common validators
 */
const validators = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^(\+62|62|0)[0-9]{9,12}$/.test(value.replace(/[\s-]/g, '')),
  nis: (value) => /^[0-9]{6,20}$/.test(value),
  nik: (value) => /^[0-9]{16}$/.test(value),
  year: (value) => {
    const year = parseInt(value, 10);
    return year >= 1900 && year <= 2100;
  },
  positiveNumber: (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
  }
};

/**
 * Handle database errors
 * @param {Error} error
 * @throws {AppError}
 */
function handleDatabaseError(error) {
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

module.exports = {
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

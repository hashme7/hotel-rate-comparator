"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalError = exports.ExternalServiceError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class ExternalServiceError extends AppError {
    constructor(message, statusCode = 503) {
        super(message, statusCode);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class TemporalError extends AppError {
    constructor(message) {
        super(message, 500);
    }
}
exports.TemporalError = TemporalError;
//# sourceMappingURL=errors.js.map
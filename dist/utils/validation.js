"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalError = exports.ExternalServiceError = exports.ValidationError = exports.AppError = exports.cityQuerySchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.cityQuerySchema = joi_1.default.object({
    city: joi_1.default.string().min(2).max(50).required().messages({
        "string.empty": "City is required",
        "string.min": "City must be at least 2 characters",
        "string.max": "City must be less than 50 characters",
        "any.required": "City parameter is required",
    }),
});
// src/utils/errors.ts
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
//# sourceMappingURL=validation.js.map
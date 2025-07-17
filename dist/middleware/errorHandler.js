"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    let error = err;
    // Log error
    logger_1.default.error("Error occurred:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });
    // Handle specific error types
    if (!(error instanceof errors_1.AppError)) {
        const statusCode = 500;
        const message = "Internal Server Error";
        error = new errors_1.AppError(message, statusCode, false);
    }
    const response = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
    };
    res.status(error.statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    const response = {
        success: false,
        error: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map
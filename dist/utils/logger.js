"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
}));
const logger = winston_1.default.createLogger({
    level: config_1.config.logLevel,
    format: config_1.config.nodeEnv === "production" ? logFormat : developmentFormat,
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: "logs/combined.log",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
    exitOnError: false,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevelopment = exports.isProduction = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    temporalAddress: process.env.TEMPORAL_ADDRESS || "localhost:7233",
    temporalApiKey: process.env.TEMPORAL_API_KEY || "",
    temporalNameSpace: process.env.TEMPORAL_NAMESPACE || "",
    logLevel: process.env.LOG_LEVEL || "info",
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3", 10),
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    },
};
exports.isProduction = exports.config.nodeEnv === "production";
exports.isDevelopment = exports.config.nodeEnv === "development";
//# sourceMappingURL=index.js.map
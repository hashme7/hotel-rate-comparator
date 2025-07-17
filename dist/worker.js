"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorker = createWorker;
exports.run = run;
const worker_1 = require("@temporalio/worker");
const activities = __importStar(require("./activities"));
const logger_1 = __importDefault(require("./utils/logger"));
const config_1 = require("./config");
function createWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.default.info("Connecting to Temporal server...", {
                address: config_1.config.temporalAddress,
                environment: config_1.config.nodeEnv,
            });
            console.log("Connecting to Temporal Cloud at:", config_1.config.temporalAddress);
            const connection = yield worker_1.NativeConnection.connect({
                address: config_1.config.temporalAddress,
                tls: true,
                apiKey: config_1.config.temporalApiKey,
            });
            console.log("Connected to Temporal server successfully");
            const worker = yield worker_1.Worker.create({
                connection,
                namespace: config_1.config.temporalNameSpace,
                taskQueue: "hotel-comparison",
                workflowsPath: require.resolve("./workflows"),
                activities,
                maxConcurrentWorkflowTaskExecutions: 10,
                maxConcurrentActivityTaskExecutions: 20,
                maxConcurrentLocalActivityExecutions: 10,
                maxHeartbeatThrottleInterval: "60 seconds",
                defaultHeartbeatThrottleInterval: "30 seconds",
                // Debug settings
                debugMode: config_1.config.nodeEnv === "development",
                // Enable SDK metrics in production
                enableSDKTracing: config_1.config.nodeEnv === "production",
            });
            logger_1.default.info("Worker created successfully", {
                taskQueue: "hotel-comparison",
                namespace: "default",
                maxConcurrentActivities: 20,
                maxConcurrentWorkflows: 10,
            });
            return worker;
        }
        catch (error) {
            console.log("Failed to create worker:", error);
            logger_1.default.error("Failed to create worker", {
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let worker = null;
        try {
            worker = yield createWorker();
            logger_1.default.info("Starting worker...");
            yield worker.run();
        }
        catch (error) {
            console.log(error);
            logger_1.default.error("Worker runtime error", {
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    });
}
// Graceful shutdown handling
function shutdown(signal) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info(`Received ${signal}, shutting down gracefully...`);
        // In a real implementation, you would add cleanup logic here
        process.exit(0);
    });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// run().catch((err) => {
//   logger.error("Worker startup failed", {
//     error: err instanceof Error ? err.message : "Unknown error",
//     stack: err instanceof Error ? err.stack : undefined,
//   });
//   process.exit(1);
// });
//# sourceMappingURL=worker.js.map
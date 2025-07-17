"use strict";
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
// src/index.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@temporalio/client");
const workflows_1 = require("./workflows");
const config_1 = require("./config");
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./middleware/errorHandler");
const security_1 = require("./middleware/security");
const logging_1 = require("./middleware/logging");
const validation_1 = require("./utils/validation");
const errors_1 = require("./utils/errors");
const uuid_1 = require("uuid");
const worker_1 = require("./worker");
class HotelRateComparatorServer {
    constructor() {
        this.temporalClient = null;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use(security_1.securityMiddleware);
        this.app.use(security_1.corsMiddleware);
        this.app.use(security_1.rateLimitMiddleware);
        // Logging middleware
        this.app.use(logging_1.requestLogger);
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: "10mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        // Trust proxy for rate limiting and logging
        this.app.set("trust proxy", 1);
    }
    setupRoutes() {
        // Health check endpoint
        this.app.get("/health", (req, res) => {
            const response = {
                success: true,
                data: {
                    status: "healthy",
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        });
        // Readiness check endpoint
        this.app.get("/ready", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.temporalClient) {
                    throw new Error("Temporal client not initialized");
                }
                const response = {
                    success: true,
                    data: { status: "ready" },
                    timestamp: new Date().toISOString(),
                };
                res.json(response);
            }
            catch (error) {
                const response = {
                    success: false,
                    error: "Service not ready",
                    timestamp: new Date().toISOString(),
                };
                res.status(503).json(response);
            }
        }));
        // Mock Supplier A endpoint
        this.app.get("/supplierA/hotels", (req, res) => {
            const mockData = [
                {
                    hotelId: "a1",
                    name: "Grand Plaza Hotel",
                    price: 6000,
                    city: "delhi",
                    commissionPct: 10,
                },
                {
                    hotelId: "a2",
                    name: "Radisson Blu",
                    price: 5900,
                    city: "delhi",
                    commissionPct: 13,
                },
                {
                    hotelId: "a3",
                    name: "Marriott Executive",
                    price: 7500,
                    city: "delhi",
                    commissionPct: 15,
                },
            ];
            logger_1.default.info("Supplier A request received", {
                query: req.query,
                ip: req.ip,
            });
            res.json(mockData);
        });
        // Mock Supplier B endpoint
        this.app.get("/supplierB/hotels", (req, res) => {
            const mockData = [
                {
                    hotelId: "b1",
                    name: "Grand Plaza Hotel",
                    price: 5340,
                    city: "delhi",
                    commissionPct: 20,
                },
                {
                    hotelId: "b2",
                    name: "Taj Palace",
                    price: 8000,
                    city: "delhi",
                    commissionPct: 15,
                },
                {
                    hotelId: "b3",
                    name: "ITC Maurya",
                    price: 9200,
                    city: "delhi",
                    commissionPct: 18,
                },
            ];
            logger_1.default.info("Supplier B request received", {
                query: req.query,
                ip: req.ip,
            });
            res.json(mockData);
        });
        // Main hotel comparison endpoint
        this.app.get("/api/hotels", (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate query parameters
                const { error, value } = validation_1.cityQuerySchema.validate(req.query);
                if (error) {
                    throw new errors_1.ValidationError(error.details[0].message);
                }
                const { city } = value;
                const workflowId = `hotel-compare-${city}-${(0, uuid_1.v4)()}`;
                logger_1.default.info("Hotel comparison request received", {
                    city,
                    workflowId,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                });
                if (!this.temporalClient) {
                    throw new errors_1.TemporalError("Temporal client not initialized");
                }
                const startTime = Date.now();
                const result = yield this.temporalClient.execute(workflows_1.compareHotelRates, {
                    args: [city],
                    taskQueue: "hotel-comparison",
                    workflowId,
                    workflowRunTimeout: "5 minutes",
                    workflowTaskTimeout: "1 minute",
                });
                const processingTime = Date.now() - startTime;
                console.log("Hotel comparison completed");
                // logger.info("Hotel comparison completed", {
                //   city,
                //   workflowId,
                //   hotelsReturned: result.hotels.length,
                //   processingTime,
                // });
                const response = {
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString(),
                };
                res.json(response);
            }
            catch (error) {
                console.log("error on /api/hotels", error);
                next(error);
            }
        }));
        // API info endpoint
        this.app.get("/api/info", (req, res) => {
            const response = {
                success: true,
                data: {
                    name: "Hotel Rate Comparator API",
                    version: "1.0.0",
                    environment: config_1.config.nodeEnv,
                    endpoints: {
                        hotels: "GET /api/hotels?city={city}",
                        health: "GET /health",
                        ready: "GET /ready",
                    },
                },
                timestamp: new Date().toISOString(),
            };
            res.json(response);
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.notFound);
        this.app.use(errorHandler_1.errorHandler);
    }
    initializeTemporalClient() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.default.info("Initializing Temporal client...", {
                    address: config_1.config.temporalAddress,
                });
                const connection = yield client_1.Connection.connect({
                    address: config_1.config.temporalAddress,
                    tls: true, // Add TLS
                    metadata: {
                        authorization: `Bearer ${config_1.config.temporalApiKey}`, // Add API key auth
                    },
                    connectTimeout: "60 seconds",
                });
                this.temporalClient = new client_1.WorkflowClient({
                    connection,
                    namespace: config_1.config.temporalNameSpace,
                });
                logger_1.default.info("Temporal client initialized successfully");
            }
            catch (error) {
                logger_1.default.error("Failed to initialize Temporal client", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                });
                throw error;
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Initialize Temporal client
                yield this.initializeTemporalClient();
                console.log("initializing application...");
                // Start the server
                this.server = this.app.listen(config_1.config.port, () => {
                    logger_1.default.info(`Server started successfully`, {
                        port: config_1.config.port,
                        environment: config_1.config.nodeEnv,
                        pid: process.pid,
                    });
                });
                // Set up graceful shutdown
                this.setupGracefulShutdown();
            }
            catch (error) {
                console.log("Failed to start server", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                });
                logger_1.default.error("Failed to start server", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                });
                process.exit(1);
            }
        });
    }
    setupGracefulShutdown() {
        const gracefulShutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Received ${signal}, shutting down gracefully...`);
            if (this.server) {
                this.server.close(() => {
                    logger_1.default.info("HTTP server closed");
                    process.exit(0);
                });
                // Force close after timeout
                setTimeout(() => {
                    logger_1.default.error("Could not close connections in time, forcefully shutting down");
                    process.exit(1);
                }, 10000);
            }
        });
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }
}
// Start the server
const server = new HotelRateComparatorServer();
(0, worker_1.run)().catch((err) => {
    console.error("Worker startup failed and exiting", {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
    });
    logger_1.default.error("Worker startup failed", {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
});
server.start().catch((error) => {
    logger_1.default.error("Server startup failed", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map
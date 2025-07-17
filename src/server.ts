// src/index.ts
import express from "express";
import { Connection, WorkflowClient } from "@temporalio/client";
import { compareHotelRates } from "./workflows";
import { config } from "./config";
import logger from "./utils/logger";
import { errorHandler, notFound } from "./middleware/errorHandler";
import {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
} from "./middleware/security";
import { requestLogger } from "./middleware/logging";
import { cityQuerySchema } from "./utils/validation";
import { ValidationError, TemporalError } from "./utils/errors";
import { ApiResponse, HotelComparisonResult, SupplierHotel } from "./types";
import { v4 as uuidv4 } from "uuid";
import { run } from "./worker";

class HotelRateComparatorServer {
  private app: express.Application;
  private temporalClient: WorkflowClient | null = null;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(securityMiddleware);
    this.app.use(corsMiddleware);
    this.app.use(rateLimitMiddleware);

    // Logging middleware
    this.app.use(requestLogger);

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Trust proxy for rate limiting and logging
    this.app.set("trust proxy", 1);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      const response: ApiResponse<{
        status: string;
        uptime: number;
        timestamp: string;
      }> = {
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
    this.app.get("/ready", async (req, res) => {
      try {
        if (!this.temporalClient) {
          throw new Error("Temporal client not initialized");
        }

        const response: ApiResponse<{ status: string }> = {
          success: true,
          data: { status: "ready" },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: "Service not ready",
          timestamp: new Date().toISOString(),
        };
        res.status(503).json(response);
      }
    });

    // Mock Supplier A endpoint
    this.app.get("/supplierA/hotels", (req, res) => {
      const mockData: SupplierHotel[] = [
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

      logger.info("Supplier A request received", {
        query: req.query,
        ip: req.ip,
      });

      res.json(mockData);
    });

    // Mock Supplier B endpoint
    this.app.get("/supplierB/hotels", (req, res) => {
      const mockData: SupplierHotel[] = [
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

      logger.info("Supplier B request received", {
        query: req.query,
        ip: req.ip,
      });

      res.json(mockData);
    });

    // Main hotel comparison endpoint
    this.app.get("/api/hotels", async (req, res, next) => {
      try {
        // Validate query parameters
        const { error, value } = cityQuerySchema.validate(req.query);
        if (error) {
          throw new ValidationError(error.details[0].message);
        }

        const { city } = value;
        const workflowId = `hotel-compare-${city}-${uuidv4()}`;

        logger.info("Hotel comparison request received", {
          city,
          workflowId,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });

        if (!this.temporalClient) {
          throw new TemporalError("Temporal client not initialized");
        }

        const startTime = Date.now();
        const result = await this.temporalClient.execute(compareHotelRates, {
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

        const response: ApiResponse<HotelComparisonResult> = {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } catch (error) {
        console.log("error on /api/hotels", error);
        next(error);
      }
    });

    // API info endpoint
    this.app.get("/api/info", (req, res) => {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          name: "Hotel Rate Comparator API",
          version: "1.0.0",
          environment: config.nodeEnv,
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

  private setupErrorHandling(): void {
    this.app.use(notFound);
    this.app.use(errorHandler);
  }

  private async initializeTemporalClient(): Promise<void> {
    try {
      logger.info("Initializing Temporal client...", {
        address: config.temporalAddress,
      });

      const connection = await Connection.connect({
        address: config.temporalAddress,
        tls: true, // Add TLS
        metadata: {
          authorization: `Bearer ${config.temporalApiKey}`, // Add API key auth
        },
        connectTimeout: "60 seconds",
      });

      this.temporalClient = new WorkflowClient({
        connection,
        namespace: config.temporalNameSpace,
      });

      logger.info("Temporal client initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Temporal client", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      // Initialize Temporal client
      await this.initializeTemporalClient();
      console.log("initializing application...")
      // Start the server
      this.server = this.app.listen(config.port, () => {
        logger.info(`Server started successfully`, {
          port: config.port,
          environment: config.nodeEnv,
          pid: process.pid,
        });
      });

      // Set up graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.log("Failed to start server", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      logger.error("Failed to start server", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      if (this.server) {
        this.server.close(() => {
          logger.info("HTTP server closed");
          process.exit(0);
        });

        // Force close after timeout
        setTimeout(() => {
          logger.error(
            "Could not close connections in time, forcefully shutting down"
          );
          process.exit(1);
        }, 10000);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }
}

// Start the server
const server = new HotelRateComparatorServer();
run().catch((err) => {
  console.error("Worker startup failed and exiting", {
    error: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined,
  });
  logger.error("Worker startup failed", {
    error: err instanceof Error ? err.message : "Unknown error",
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});

server.start().catch((error) => {
  logger.error("Server startup failed", error);
  process.exit(1);
});
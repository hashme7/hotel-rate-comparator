import dotenv from "dotenv";
import { Config } from "../types";

dotenv.config();

export const config: Config = {
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

export const isProduction = config.nodeEnv === "production";
export const isDevelopment = config.nodeEnv === "development";

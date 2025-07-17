import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";
import logger from "./utils/logger";
import { config } from "./config";



export async function createWorker() {
  try {
    logger.info("Connecting to Temporal server...", {
      address: config.temporalAddress,
      environment: config.nodeEnv,
    });
    console.log("Connecting to Temporal Cloud at:", config.temporalAddress);

    const connection = await NativeConnection.connect({
      address: config.temporalAddress,
      tls: true,
      apiKey: config.temporalApiKey,
    });

    console.log("Connected to Temporal server successfully");

    const worker = await Worker.create({
      connection,
      namespace: config.temporalNameSpace,
      taskQueue: "hotel-comparison",
      workflowsPath: require.resolve("./workflows"),
      activities,
      maxConcurrentWorkflowTaskExecutions: 10,
      maxConcurrentActivityTaskExecutions: 20,
      maxConcurrentLocalActivityExecutions: 10,
      maxHeartbeatThrottleInterval: "60 seconds",
      defaultHeartbeatThrottleInterval: "30 seconds",
      // Debug settings
      debugMode: config.nodeEnv === "development",
      // Enable SDK metrics in production
      enableSDKTracing: config.nodeEnv === "production",
    });

    logger.info("Worker created successfully", {
      taskQueue: "hotel-comparison",
      namespace: "default",
      maxConcurrentActivities: 20,
      maxConcurrentWorkflows: 10,
    });

    return worker;
  } catch (error) {
    console.log( "Failed to create worker:",error,);
    logger.error("Failed to create worker", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function run() {
  let worker: Worker | null = null;
  try {
    worker = await createWorker();
    logger.info("Starting worker...");
    await worker.run();
  } catch (error) {
    console.log(error)
    logger.error("Worker runtime error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Graceful shutdown handling
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  // In a real implementation, you would add cleanup logic here
  process.exit(0);
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

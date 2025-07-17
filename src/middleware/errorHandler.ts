import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { ApiResponse } from "../types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Log error
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Handle specific error types
  if (!(error instanceof AppError)) {
    const statusCode = 500;
    const message = "Internal Server Error";
    error = new AppError(message, statusCode, false);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
  };

  res.status((error as AppError).statusCode).json(response);
};

export const notFound = (req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};

import axios, { AxiosError } from "axios";
import { SupplierHotel } from "../types";
import { ExternalServiceError } from "../utils/errors";
import logger from "../utils/logger";
import { config } from "../config";

const axiosInstance = axios.create({
  timeout: config.requestTimeout,
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "Hotel-Rate-Comparator/1.0",
  },
});

// Request logging
axiosInstance.interceptors.request.use(
  (config) => {
    logger.debug("Making HTTP request", {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    logger.error("Request interceptor error", error);
    return Promise.reject(error);
  }
);

// Response logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("http response received")
    logger.debug("HTTP response received", {
      status: response.status,
      url: response.config.url,
      dataLength: JSON.stringify(response.data).length,
    });
    return response;
  },
  (error: AxiosError) => {
    logger.error("HTTP request failed", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  try {
    logger.info("Fetching data from Supplier A", { city });

    const response = await axiosInstance.get<SupplierHotel[]>(
      `http://localhost:3000/supplierA/hotels?city=${encodeURIComponent(city)}`
    );
    
    logger.info("Successfully fetched data from Supplier A", {
      city,
      count: response.data.length,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error("Failed to fetch from Supplier A", {
      city,
      error: axiosError.message,
      status: axiosError.response?.status,
    });

    throw new ExternalServiceError(
      `Failed to fetch hotels from Supplier A: ${axiosError.message}`,
      axiosError.response?.status || 503
    );
  }
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  try {
    logger.info("Fetching data from Supplier B", { city });

    const response = await axiosInstance.get<SupplierHotel[]>(
      `http://localhost:3000/supplierB/hotels?city=${encodeURIComponent(city)}`
    );

    logger.info("Successfully fetched data from Supplier B", {
      city,
      count: response.data.length,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    logger.error("Failed to fetch from Supplier B", {
      city,
      error: axiosError.message,
      status: axiosError.response?.status,
    });

    throw new ExternalServiceError(
      `Failed to fetch hotels from Supplier B: ${axiosError.message}`,
      axiosError.response?.status || 503
    );
  }
}

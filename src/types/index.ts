export interface Hotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface HotelComparisonResult {
  hotels: Hotel[];
  supplierACount: number;
  supplierBCount: number;
  processingTime: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  temporalAddress: string;
  temporalApiKey: string;
  temporalNameSpace: string;
  logLevel: string;
  requestTimeout: number;
  retryAttempts: number;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// src/workflows/index.ts
import { proxyActivities, log, sleep } from "@temporalio/workflow";
import type * as activities from "../activities";
import { Hotel, HotelComparisonResult, SupplierHotel } from "../types";

const { fetchSupplierA, fetchSupplierB } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  heartbeatTimeout: "30 seconds",
  retry: {
    initialInterval: "1 second",
    backoffCoefficient: 2,
    maximumInterval: "10 seconds",
    maximumAttempts: 3,
  },
});

export async function compareHotelRates(
  city: string
): Promise<HotelComparisonResult> {
  const startTime = Date.now();

  log.info("Starting hotel rate comparison workflow", { city });
  console.log("Starting hotel rate comparison workflow");
  try {
    // Input validation

    if (!city || city.trim().length === 0) {
      throw new Error("City parameter is required and cannot be empty");
    }

    const normalizedCity = city.trim().toLowerCase();

    // Fetch data from both suppliers in parallel with timeout
    log.info("Fetching data from suppliers in parallel", {
      city: normalizedCity,
    });

    const [supplierAResult, supplierBResult] = await Promise.allSettled([
      fetchSupplierA(normalizedCity),
      fetchSupplierB(normalizedCity),
    ]);

    // Handle partial failures
    let supplierAData: SupplierHotel[] = [];
    let supplierBData: SupplierHotel[] = [];

    if (supplierAResult.status === "fulfilled") {
      supplierAData = supplierAResult.value;
      log.info("Supplier A data fetched successfully", {
        city: normalizedCity,
        count: supplierAData.length,
      });
    } else {
      log.error("Supplier A failed", {
        city: normalizedCity,
        error: supplierAResult.reason,
      });
    }

    if (supplierBResult.status === "fulfilled") {
      supplierBData = supplierBResult.value;
      log.info("Supplier B data fetched successfully", {
        city: normalizedCity,
        count: supplierBData.length,
      });
    } else {
      log.error("Supplier B failed", {
        city: normalizedCity,
        error: supplierBResult.reason,
      });
    }

    // Check if we have any data
    if (supplierAData.length === 0 && supplierBData.length === 0) {
      log.warn("No data available from any supplier", { city: normalizedCity });

      // If both suppliers failed, wait a bit and maybe they'll recover
      await sleep("5 seconds");

      throw new Error("No hotel data available from any supplier");
    }

    // Process and merge data
    const hotels = processHotelData(
      supplierAData,
      supplierBData,
      normalizedCity
    );

    const processingTime = Date.now() - startTime;

    log.info("Hotel comparison completed successfully", {
      city: normalizedCity,
      totalHotels: hotels.length,
      supplierACount: supplierAData.length,
      supplierBCount: supplierBData.length,
      processingTime,
    });
    console.log(hotels,"hotels")
    return {
      hotels,
      supplierACount: supplierAData.length,
      supplierBCount: supplierBData.length,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    log.error("Hotel comparison workflow failed", {
      city,
      error: error instanceof Error ? error.message : "Unknown error",
      processingTime,
    });

    throw error;
  }
}

function processHotelData(
  supplierAData: SupplierHotel[],
  supplierBData: SupplierHotel[],
  city: string
): Hotel[] {
  const hotelsMap = new Map<string, Hotel>();

  // Process Supplier A data
  supplierAData.forEach((hotel: SupplierHotel) => {
    if (isValidHotel(hotel)) {
      const normalizedName = hotel.name.trim().toLowerCase();
      hotelsMap.set(normalizedName, {
        name: hotel.name.trim(),
        price: Math.round(hotel.price * 100) ,
        supplier: "Supplier A",
        commissionPct: hotel.commissionPct,
      });
    }
  });

  // Process Supplier B data (keep the cheaper option)
  supplierBData.forEach((hotel: SupplierHotel) => {
    if (isValidHotel(hotel)) {
      const normalizedName = hotel.name.trim().toLowerCase();
      const existingHotel = hotelsMap.get(normalizedName);

      if (!existingHotel || hotel.price < existingHotel.price) {
        hotelsMap.set(normalizedName, {
          name: hotel.name.trim(),
          price: Math.round(hotel.price * 100) / 100, 
          supplier: "Supplier B",
          commissionPct: hotel.commissionPct,
        });
      }
    }
  });

  // Sort by price (ascending)
  return Array.from(hotelsMap.values()).sort((a, b) => a.price - b.price);
}

function isValidHotel(hotel: SupplierHotel): boolean {
  return !!(
    hotel &&
    hotel.name &&
    hotel.name.trim().length > 0 &&
    typeof hotel.price === "number" &&
    hotel.price > 0 &&
    typeof hotel.commissionPct === "number" &&
    hotel.commissionPct >= 0 &&
    hotel.commissionPct <= 100
  );
}

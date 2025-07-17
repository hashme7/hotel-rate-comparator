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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHotelRates = compareHotelRates;
// src/workflows/index.ts
const workflow_1 = require("@temporalio/workflow");
const { fetchSupplierA, fetchSupplierB } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "2 minutes",
    heartbeatTimeout: "30 seconds",
    retry: {
        initialInterval: "1 second",
        backoffCoefficient: 2,
        maximumInterval: "10 seconds",
        maximumAttempts: 3,
    },
});
function compareHotelRates(city) {
    return __awaiter(this, void 0, void 0, function* () {
        const startTime = Date.now();
        workflow_1.log.info("Starting hotel rate comparison workflow", { city });
        console.log("Starting hotel rate comparison workflow");
        try {
            // Input validation
            if (!city || city.trim().length === 0) {
                throw new Error("City parameter is required and cannot be empty");
            }
            const normalizedCity = city.trim().toLowerCase();
            // Fetch data from both suppliers in parallel with timeout
            workflow_1.log.info("Fetching data from suppliers in parallel", {
                city: normalizedCity,
            });
            const [supplierAResult, supplierBResult] = yield Promise.allSettled([
                fetchSupplierA(normalizedCity),
                fetchSupplierB(normalizedCity),
            ]);
            // Handle partial failures
            let supplierAData = [];
            let supplierBData = [];
            if (supplierAResult.status === "fulfilled") {
                supplierAData = supplierAResult.value;
                workflow_1.log.info("Supplier A data fetched successfully", {
                    city: normalizedCity,
                    count: supplierAData.length,
                });
            }
            else {
                workflow_1.log.error("Supplier A failed", {
                    city: normalizedCity,
                    error: supplierAResult.reason,
                });
            }
            if (supplierBResult.status === "fulfilled") {
                supplierBData = supplierBResult.value;
                workflow_1.log.info("Supplier B data fetched successfully", {
                    city: normalizedCity,
                    count: supplierBData.length,
                });
            }
            else {
                workflow_1.log.error("Supplier B failed", {
                    city: normalizedCity,
                    error: supplierBResult.reason,
                });
            }
            // Check if we have any data
            if (supplierAData.length === 0 && supplierBData.length === 0) {
                workflow_1.log.warn("No data available from any supplier", { city: normalizedCity });
                // If both suppliers failed, wait a bit and maybe they'll recover
                yield (0, workflow_1.sleep)("5 seconds");
                throw new Error("No hotel data available from any supplier");
            }
            // Process and merge data
            const hotels = processHotelData(supplierAData, supplierBData, normalizedCity);
            const processingTime = Date.now() - startTime;
            workflow_1.log.info("Hotel comparison completed successfully", {
                city: normalizedCity,
                totalHotels: hotels.length,
                supplierACount: supplierAData.length,
                supplierBCount: supplierBData.length,
                processingTime,
            });
            console.log(hotels, "hotels");
            return {
                hotels,
                supplierACount: supplierAData.length,
                supplierBCount: supplierBData.length,
                processingTime,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            workflow_1.log.error("Hotel comparison workflow failed", {
                city,
                error: error instanceof Error ? error.message : "Unknown error",
                processingTime,
            });
            throw error;
        }
    });
}
function processHotelData(supplierAData, supplierBData, city) {
    const hotelsMap = new Map();
    // Process Supplier A data
    supplierAData.forEach((hotel) => {
        if (isValidHotel(hotel)) {
            const normalizedName = hotel.name.trim().toLowerCase();
            hotelsMap.set(normalizedName, {
                name: hotel.name.trim(),
                price: Math.round(hotel.price * 100),
                supplier: "Supplier A",
                commissionPct: hotel.commissionPct,
            });
        }
    });
    // Process Supplier B data (keep the cheaper option)
    supplierBData.forEach((hotel) => {
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
function isValidHotel(hotel) {
    return !!(hotel &&
        hotel.name &&
        hotel.name.trim().length > 0 &&
        typeof hotel.price === "number" &&
        hotel.price > 0 &&
        typeof hotel.commissionPct === "number" &&
        hotel.commissionPct >= 0 &&
        hotel.commissionPct <= 100);
}
//# sourceMappingURL=index.js.map
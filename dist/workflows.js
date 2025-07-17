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
const workflow_1 = require("@temporalio/workflow");
const { fetchSupplierA, fetchSupplierB } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "1 minute",
});
function compareHotelRates(city) {
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch data in parallel
        const [supplierAData, supplierBData] = yield Promise.all([
            fetchSupplierA(city),
            fetchSupplierB(city),
        ]);
        // Merge and deduplicate
        const hotelsMap = new Map();
        // Process Supplier A
        supplierAData.forEach((hotel) => {
            hotelsMap.set(hotel.name, {
                name: hotel.name,
                price: hotel.price,
                supplier: "Supplier A",
                commissionPct: hotel.commissionPct,
            });
        });
        // Process Supplier B (keep the cheaper option)
        supplierBData.forEach((hotel) => {
            const existingHotel = hotelsMap.get(hotel.name);
            if (!existingHotel || hotel.price < existingHotel.price) {
                hotelsMap.set(hotel.name, {
                    name: hotel.name,
                    price: hotel.price,
                    supplier: "Supplier B",
                    commissionPct: hotel.commissionPct,
                });
            }
        });
        return Array.from(hotelsMap.values());
    });
}
//# sourceMappingURL=workflows.js.map
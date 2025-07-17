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
exports.fetchSupplierA = fetchSupplierA;
exports.fetchSupplierB = fetchSupplierB;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
const axiosInstance = axios_1.default.create({
    timeout: config_1.config.requestTimeout,
    headers: {
        "Content-Type": "application/json",
        "User-Agent": "Hotel-Rate-Comparator/1.0",
    },
});
// Request logging
axiosInstance.interceptors.request.use((config) => {
    logger_1.default.debug("Making HTTP request", {
        method: config.method,
        url: config.url,
        headers: config.headers,
    });
    return config;
}, (error) => {
    logger_1.default.error("Request interceptor error", error);
    return Promise.reject(error);
});
// Response logging
axiosInstance.interceptors.response.use((response) => {
    console.log("http response received");
    logger_1.default.debug("HTTP response received", {
        status: response.status,
        url: response.config.url,
        dataLength: JSON.stringify(response.data).length,
    });
    return response;
}, (error) => {
    var _a, _b, _c;
    logger_1.default.error("HTTP request failed", {
        url: (_a = error.config) === null || _a === void 0 ? void 0 : _a.url,
        method: (_b = error.config) === null || _b === void 0 ? void 0 : _b.method,
        status: (_c = error.response) === null || _c === void 0 ? void 0 : _c.status,
        message: error.message,
    });
    return Promise.reject(error);
});
function fetchSupplierA(city) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            logger_1.default.info("Fetching data from Supplier A", { city });
            const response = yield axiosInstance.get(`http://localhost:3000/supplierA/hotels?city=${encodeURIComponent(city)}`);
            logger_1.default.info("Successfully fetched data from Supplier A", {
                city,
                count: response.data.length,
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            logger_1.default.error("Failed to fetch from Supplier A", {
                city,
                error: axiosError.message,
                status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
            });
            throw new errors_1.ExternalServiceError(`Failed to fetch hotels from Supplier A: ${axiosError.message}`, ((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) || 503);
        }
    });
}
function fetchSupplierB(city) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            logger_1.default.info("Fetching data from Supplier B", { city });
            const response = yield axiosInstance.get(`http://localhost:3000/supplierB/hotels?city=${encodeURIComponent(city)}`);
            logger_1.default.info("Successfully fetched data from Supplier B", {
                city,
                count: response.data.length,
            });
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            logger_1.default.error("Failed to fetch from Supplier B", {
                city,
                error: axiosError.message,
                status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
            });
            throw new errors_1.ExternalServiceError(`Failed to fetch hotels from Supplier B: ${axiosError.message}`, ((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) || 503);
        }
    });
}
//# sourceMappingURL=index.js.map
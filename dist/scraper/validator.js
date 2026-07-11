"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLinkedInUrl = isValidLinkedInUrl;
exports.normalizeLinkedInUrl = normalizeLinkedInUrl;
const types_1 = require("./types");
/**
 * Validates if the given string is a valid LinkedIn URL.
 * It checks that the URL uses HTTP/HTTPS protocol and points to linkedin.com.
 */
function isValidLinkedInUrl(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        // Check if hostname is linkedin.com or ends with .linkedin.com
        const isLinkedIn = hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
        const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        return isLinkedIn && isHttp;
    }
    catch (error) {
        return false;
    }
}
/**
 * Normalizes the LinkedIn URL by removing tracking query parameters and ensuring HTTPS.
 */
function normalizeLinkedInUrl(url) {
    if (!isValidLinkedInUrl(url)) {
        throw new types_1.ScraperException('INVALID_URL', 'The provided URL is not a valid LinkedIn URL.');
    }
    try {
        const parsed = new URL(url);
        // Enforce https
        parsed.protocol = 'https:';
        // Clean up tracking query parameters
        const paramsToKeep = ['id']; // Keep only essential params if needed, or clear all
        const keys = Array.from(parsed.searchParams.keys());
        for (const key of keys) {
            if (!paramsToKeep.includes(key)) {
                parsed.searchParams.delete(key);
            }
        }
        return parsed.toString();
    }
    catch (error) {
        throw new types_1.ScraperException('INVALID_URL', 'Failed to normalize the LinkedIn URL.');
    }
}

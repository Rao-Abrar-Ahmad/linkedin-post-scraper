"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const linkedin_1 = require("../scraper/linkedin");
const types_1 = require("../scraper/types");
const router = (0, express_1.Router)();
// Express async handler wrapper to catch async exceptions
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
router.post('/scrape', asyncHandler(async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
        throw new types_1.ScraperException('INVALID_URL', 'The URL parameter is required and must be a string.');
    }
    console.log(`[API] Received scrape request for URL: ${url}`);
    const postData = await (0, linkedin_1.scrapeLinkedInPost)(url);
    res.status(200).json({
        success: true,
        data: postData
    });
}));
exports.default = router;

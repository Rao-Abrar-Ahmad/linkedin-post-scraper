"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const browser_1 = require("./scraper/browser");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const server = app_1.default.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
    // Pre-warm the Playwright Chromium browser on startup
    try {
        const browserManager = browser_1.BrowserManager.getInstance();
        await browserManager.initialize();
        console.log('Pre-warmed scraper browser successfully.');
    }
    catch (error) {
        console.error('Failed to pre-warm browser. It will attempt to launch on first request:', error);
    }
});
// Graceful shutdown handling
const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    // Close server first
    server.close(() => {
        console.log('Express HTTP server closed.');
    });
    // Close scraper browser instance
    try {
        const browserManager = browser_1.BrowserManager.getInstance();
        await browserManager.close();
    }
    catch (err) {
        console.error('Error closing browser manager during shutdown:', err);
    }
    console.log('Shutdown complete. Exiting.');
    process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

import dotenv from 'dotenv';
import app from './app';
import { BrowserManager } from './scraper/browser';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);

  // Pre-warm the Playwright Chromium browser on startup
  try {
    const browserManager = BrowserManager.getInstance();
    await browserManager.initialize();
    console.log('Pre-warmed scraper browser successfully.');
  } catch (error) {
    console.error('Failed to pre-warm browser. It will attempt to launch on first request:', error);
  }
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Close server first
  server.close(() => {
    console.log('Express HTTP server closed.');
  });

  // Close scraper browser instance
  try {
    const browserManager = BrowserManager.getInstance();
    await browserManager.close();
  } catch (err) {
    console.error('Error closing browser manager during shutdown:', err);
  }

  console.log('Shutdown complete. Exiting.');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

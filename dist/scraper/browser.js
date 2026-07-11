"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserManager = void 0;
const playwright_1 = require("playwright");
class BrowserManager {
    static instance;
    browser = null;
    isLaunching = false;
    constructor() { }
    static getInstance() {
        if (!BrowserManager.instance) {
            BrowserManager.instance = new BrowserManager();
        }
        return BrowserManager.instance;
    }
    /**
     * Initializes the shared browser instance.
     */
    async initialize() {
        if (this.browser) {
            return this.browser;
        }
        if (this.isLaunching) {
            // Wait for launch to finish if another request is triggering it
            while (this.isLaunching) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            if (this.browser)
                return this.browser;
        }
        this.isLaunching = true;
        try {
            console.log('Launching Playwright Chromium browser instance...');
            this.browser = await playwright_1.chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080'
                ]
            });
            console.log('Browser launched successfully.');
            return this.browser;
        }
        catch (error) {
            console.error('Failed to launch Playwright browser:', error);
            this.isLaunching = false;
            throw error;
        }
        finally {
            this.isLaunching = false;
        }
    }
    /**
     * Creates a new sandboxed browser context and page.
     * Employs standard anti-detection techniques (User Agent spoofing, standard headers, bypass webdriver).
     */
    async createPage() {
        const browser = await this.initialize();
        // Use a standard desktop browser User Agent to minimize blocks
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
        const context = await browser.newContext({
            userAgent,
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1,
            locale: 'en-US',
            timezoneId: 'America/New_York',
            extraHTTPHeaders: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        // Add script to bypass basic automated detector properties
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        });
        const page = await context.newPage();
        return { context, page };
    }
    /**
     * Closes the active browser instance.
     */
    async close() {
        if (this.browser) {
            console.log('Closing browser instance...');
            await this.browser.close();
            this.browser = null;
            console.log('Browser closed.');
        }
    }
}
exports.BrowserManager = BrowserManager;

# LinkedIn Public Post Scraper

## Technical Requirements & Architecture

Version: 1.0

## Overview

Build a public web application where users paste a public LinkedIn post
URL and receive:

-   Post content
-   Images
-   Author
-   Author headline
-   Posted date
-   Like count
-   Comment count
-   Copy Content button

Only **public posts** are supported.

------------------------------------------------------------------------

# Technology Stack

  Layer      Technology
  ---------- ----------------------
  Frontend   React + Tailwind CSS
  Backend    Node.js + Express.js
  Scraper    Playwright
  Hosting    Sevalla
  Database   None
  Cache      None (MVP)

------------------------------------------------------------------------

# Architecture

``` text
React
   │
POST /api/scrape
   │
Express API
   │
Validate URL
   │
Normalize URL
   │
Browser Manager
   │
Persistent Chromium
   │
New Browser Context
   │
New Page
   │
LinkedIn
   │
DOM Parser
   │
JSON Response
```

------------------------------------------------------------------------

# Project Structure

``` text
src/
├── app.ts
├── server.ts
├── routes/
│   └── scrape.ts
├── scraper/
│   ├── browser.ts
│   ├── linkedin.ts
│   ├── parser.ts
│   ├── selectors.ts
│   ├── validator.ts
│   └── types.ts
├── middleware/
├── config/
└── utils/
```

------------------------------------------------------------------------

# Browser Lifecycle

-   Launch Chromium once on server startup.
-   Reuse the browser instance.
-   Create a new BrowserContext per request.
-   Create a new Page.
-   Scrape.
-   Close BrowserContext.

------------------------------------------------------------------------

# API

## POST /api/scrape

Request

``` json
{
  "url": "https://www.linkedin.com/posts/..."
}
```

Success

``` json
{
  "success": true,
  "data": {
    "url": "...",
    "author": {
      "name": "...",
      "headline": "...",
      "profileUrl": "..."
    },
    "content": "...",
    "images": [],
    "likes": 120,
    "comments": 15,
    "postedAt": "...",
    "scrapedAt": "..."
  }
}
```

Error

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "Unsupported LinkedIn URL."
  }
}
```

------------------------------------------------------------------------

# Error Codes

-   INVALID_URL
-   POST_NOT_FOUND
-   LOGIN_REQUIRED
-   CAPTCHA_REQUIRED
-   SCRAPE_TIMEOUT
-   LINKEDIN_BLOCKED
-   NETWORK_ERROR
-   INTERNAL_ERROR

------------------------------------------------------------------------

# Implementation Examples

## Express Route

``` ts
router.post("/scrape", scrapeController);
```

## Browser Manager

``` ts
const browser = await chromium.launch({
  headless: true
});

const context = await browser.newContext();
const page = await context.newPage();
```

## Navigate

``` ts
await page.goto(url, {
  waitUntil: "networkidle"
});
```

## Parser

``` ts
const content = await page.locator("YOUR_SELECTOR").innerText();
```

Keep every selector inside `selectors.ts`.

## Selector File

``` ts
export const SELECTORS = {
  AUTHOR: "...",
  CONTENT: "...",
  IMAGES: "...",
  LIKES: "...",
  COMMENTS: "...",
  DATE: "..."
};
```

## URL Validation

``` ts
function isValidLinkedInUrl(url: string) {
  return /^https?:\/\/(www\.)?linkedin\.com\//.test(url);
}
```

## Response Contract

``` ts
interface ScrapedPost {
  url: string;
  author: {
    name: string;
    headline?: string;
    profileUrl?: string;
  };
  content: string;
  images: string[];
  likes?: number;
  comments?: number;
  postedAt?: string;
  scrapedAt: string;
}
```

------------------------------------------------------------------------

# Development Phases

## Phase 1

-   Express setup
-   Browser manager
-   URL validation
-   DOM scraper
-   API

## Phase 2

-   React UI
-   Tailwind
-   Copy button
-   Loading & error states

## Phase 3

-   Polish
-   Responsive UI
-   Better error handling
-   Deployment

------------------------------------------------------------------------

# Future Enhancements

-   Redis caching
-   Rate limiting
-   Queue workers
-   Background scraping
-   Multiple providers
-   Analytics
-   Export to Markdown/TXT

------------------------------------------------------------------------

# Non Goals

-   Authentication
-   Database
-   Private LinkedIn posts
-   Logged-in scraping
-   Cloudflare Workers
-   Scheduled scraping
-   Image storage

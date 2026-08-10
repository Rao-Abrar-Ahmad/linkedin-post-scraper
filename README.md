# LinkedIn Post Scraper & Content Copier (LPS)

**LPS (LinkedIn Post Scraper)** is a free, open-source web application, API, and Model Context Protocol (MCP) server to scrape and copy public LinkedIn posts. Extract full post text, high-resolution media attachments, author metadata, and reaction counts instantly. Copy text cleanly or export formatted Markdown files — no LinkedIn account required.

---

## ✨ Features

- 📝 **Post Content Copier**: Copy clean post text with one click.
- 🖼️ **Image Scraper**: Extract high-res attached post photos and carousel images.
- 📊 **Metrics & Metadata**: View like counts, comment counts, author headline, and follower stats.
- 📄 **Markdown Export**: Download formatted `.md` files complete with author details and media links.
- 🤖 **MCP & AI Ready**: Native Model Context Protocol (`/api/mcp`) server & `llms.txt` integration for AI agents.
- 📱 **Installable PWA**: Progressive Web App with manifest and offline caching.
- 🌐 **SEO Optimized**: Complete with `sitemap.xml`, `robots.txt`, and Schema.org JSON-LD markup.

---

## 🤖 AI Agent & MCP Integration

### Model Context Protocol (MCP) Server Endpoint
AI agents (e.g. Claude Desktop, Cursor, Custom Agents) can invoke LPS directly via MCP:
- **MCP HTTP Endpoint**: `POST /api/mcp`
- **Tool Name**: `scrape_linkedin_post`
- **Argument**: `{ "url": "https://www.linkedin.com/posts/..." }`

### LLM Specifications
- Documentation for AI agents is available at [/llms.txt](https://lps.codebyrsa.com/llms.txt).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rao-Abrar-Ahmad/linkedin-post-scraper.git
   cd linkedin-post-scraper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, PWA Service Worker
- **Backend**: Node.js, Express.js, Playwright (Headless Browser)
- **AI Protocols**: Model Context Protocol (MCP HTTP & JSON-RPC)
- **Data Parser**: Schema.org `SocialMediaPosting` JSON-LD

---

## 👨‍💻 Creator & Publisher

- **Created by**: [Rao Abrar Ahmad](https://github.com/Rao-Abrar-Ahmad)
- **Organization**: [CodebyRSA](https://codebyrsa.com)
- **Repository**: [github.com/Rao-Abrar-Ahmad/linkedin-post-scraper](https://github.com/Rao-Abrar-Ahmad/linkedin-post-scraper)

---

## ⚖️ License

Distributed under the MIT License.
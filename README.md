# LinkedIn Post Scraper & Content Copier (LPS)

**LPS (LinkedIn Post Scraper)** is a free, open-source web application to scrape and copy public LinkedIn posts. Extract full post text, high-resolution media attachments, author metadata, and reaction counts instantly. Copy text cleanly or export formatted Markdown files for Notion, Obsidian, and documentation — no LinkedIn account or login required.

---

## ✨ Features

- 📝 **Post Content Copier**: Copy clean post text with one click.
- 🖼️ **Image Scraper**: Extract high-res attached post photos and carousel images.
- 📊 **Metrics & Metadata**: View like counts, comment counts, author headline, and follower stats.
- 📄 **Markdown Export**: Download formatted `.md` files complete with author details and media links.
- 🔒 **100% Anonymous**: Uses Schema.org JSON-LD structured data extraction — no LinkedIn login or browser extensions required.

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

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Playwright (Headless Browser)
- **Data Parser**: Schema.org `SocialMediaPosting` JSON-LD

---

## 👨‍💻 Creator & Publisher

- **Created by**: [Rao Abrar Ahmad](https://github.com/Rao-Abrar-Ahmad)
- **Organization**: [CodebyRSA](https://codebyrsa.com)
- **Repository**: [github.com/Rao-Abrar-Ahmad/linkedin-post-scraper](https://github.com/Rao-Abrar-Ahmad/linkedin-post-scraper)

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
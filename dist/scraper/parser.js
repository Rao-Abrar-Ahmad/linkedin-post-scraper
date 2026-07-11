"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePostPage = parsePostPage;
const selectors_1 = require("./selectors");
/**
 * Helper to try multiple selectors and return the first matching text/attribute.
 */
async function getText(page, selectors) {
    for (const selector of selectors) {
        try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
                const text = await element.innerText();
                if (text && text.trim()) {
                    return text.trim();
                }
            }
        }
        catch {
            // Continue to next selector
        }
    }
    return undefined;
}
/**
 * Extracts a list of attribute values from selectors.
 */
async function getAttributeList(page, selectors, attribute) {
    const results = [];
    for (const selector of selectors) {
        try {
            const elements = page.locator(selector);
            const count = await elements.count();
            if (count > 0) {
                for (let i = 0; i < count; i++) {
                    const attr = await elements.nth(i).getAttribute(attribute);
                    if (attr && !results.includes(attr)) {
                        results.push(attr);
                    }
                }
                if (results.length > 0) {
                    return results;
                }
            }
        }
        catch {
            // Continue to next selector
        }
    }
    return results;
}
/**
 * Parses numeric value from a string (e.g. "120 likes", "1.5K comments").
 */
function parseCount(text) {
    if (!text)
        return undefined;
    // Clean up string
    const cleaned = text.toLowerCase().replace(/[^0-9.k]/g, '').trim();
    if (!cleaned)
        return undefined;
    let multiplier = 1;
    let numStr = cleaned;
    if (cleaned.includes('k')) {
        multiplier = 1000;
        numStr = cleaned.replace('k', '');
    }
    const parsedNum = parseFloat(numStr);
    return isNaN(parsedNum) ? undefined : Math.round(parsedNum * multiplier);
}
/**
 * Extracts data from Open Graph/meta tags as a fallback.
 */
async function getMetaContent(page, propertyOrName) {
    try {
        const meta = page.locator(`meta[property="${propertyOrName}"], meta[name="${propertyOrName}"]`).first();
        const content = await meta.getAttribute('content');
        return content ? content.trim() : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Parses a public LinkedIn post page DOM and returns the scraped data.
 */
async function parsePostPage(page, url) {
    // 1. Try DOM selectors first for Author
    let authorName = await getText(page, selectors_1.SELECTORS.AUTHOR_NAME);
    let authorHeadline = await getText(page, selectors_1.SELECTORS.AUTHOR_HEADLINE);
    // Profile link
    let profileUrl;
    for (const selector of selectors_1.SELECTORS.AUTHOR_PROFILE) {
        try {
            const element = page.locator(selector).first();
            const href = await element.getAttribute('href');
            if (href) {
                // Build absolute URL if relative
                profileUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
                break;
            }
        }
        catch {
            // Continue
        }
    }
    // 2. Try DOM selectors for content
    let content = await getText(page, selectors_1.SELECTORS.CONTENT);
    // 3. Try DOM selectors for media (images)
    const images = await getAttributeList(page, selectors_1.SELECTORS.IMAGES, 'src');
    // 4. Try DOM selectors for engagement metrics
    const likesText = await getText(page, selectors_1.SELECTORS.LIKES_COUNT);
    const commentsText = await getText(page, selectors_1.SELECTORS.COMMENTS_COUNT);
    const likes = parseCount(likesText);
    const comments = parseCount(commentsText);
    // 5. Try DOM selectors for date/time ago
    const postedAtText = await getText(page, selectors_1.SELECTORS.DATE);
    // --- Fallbacks using Meta tags & Page details if DOM elements were not found ---
    // Fallback for author name from Meta OG Title or Page Title
    if (!authorName) {
        const ogTitle = await getMetaContent(page, 'og:title');
        if (ogTitle) {
            // ogTitle typically looks like: "Author Name on LinkedIn: Post Content text..."
            // Or "Author Name on LinkedIn"
            const authorMatch = ogTitle.split(' on LinkedIn')[0];
            if (authorMatch && authorMatch.trim()) {
                authorName = authorMatch.trim();
            }
        }
        // Page Title fallback
        if (!authorName) {
            const pageTitle = await page.title();
            if (pageTitle && pageTitle.includes('on LinkedIn')) {
                authorName = pageTitle.split(' on LinkedIn')[0].trim();
            }
        }
    }
    // Fallback for post content from Meta description
    if (!content) {
        const ogDescription = await getMetaContent(page, 'og:description');
        if (ogDescription) {
            content = ogDescription;
        }
    }
    // Fallback for post image from Meta image
    if (images.length === 0) {
        const ogImage = await getMetaContent(page, 'og:image');
        if (ogImage) {
            images.push(ogImage);
        }
    }
    // Fallback default for author if still missing
    if (!authorName) {
        authorName = 'LinkedIn Member';
    }
    // Fallback default for content if still missing
    if (!content) {
        content = '';
    }
    return {
        url,
        author: {
            name: authorName,
            headline: authorHeadline || 'LinkedIn User',
            profileUrl: profileUrl
        },
        content,
        images,
        likes: likes || 0,
        comments: comments || 0,
        postedAt: postedAtText || 'Recently',
        scrapedAt: new Date().toISOString()
    };
}

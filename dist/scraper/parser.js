"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePostPage = parsePostPage;
exports.parseJsonLd = parseJsonLd;
const selectors_1 = require("./selectors");
// ─────────────────────────────────────────────────────────────────────────────
// Low-level DOM helpers
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Tries each selector in order and returns the inner text of the first visible
 * element found, or undefined if none match.
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
 * Tries each selector in order and returns the requested attribute value of
 * the first matching element, or undefined if none match.
 */
async function getAttribute(page, selectors, attribute) {
    for (const selector of selectors) {
        try {
            const element = page.locator(selector).first();
            const value = await element.getAttribute(attribute);
            if (value && value.trim()) {
                return value.trim();
            }
        }
        catch {
            // Continue to next selector
        }
    }
    return undefined;
}
/**
 * Returns distinct, non-empty attribute values collected from ALL elements
 * matched by the first selector that yields at least one result.
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
 * Reads the content attribute of the first matching <meta> tag.
 */
async function getMetaContent(page, propertyOrName) {
    try {
        const meta = page
            .locator(`meta[property="${propertyOrName}"], meta[name="${propertyOrName}"]`)
            .first();
        const content = await meta.getAttribute('content');
        return content ? content.trim() : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Parses the JSON-LD <script type="application/ld+json"> block that LinkedIn
 * injects on public post pages.  Returns null if absent or malformed.
 *
 * The block contains a SocialMediaPosting schema with:
 *   - articleBody   — full post text
 *   - datePublished — ISO 8601 timestamp
 *   - author.name   — author display name
 *   - author.url    — profile URL
 *   - interactionStatistic — array with LikeAction and CommentAction counts
 *   - commentCount  — total comment count
 */
async function extractJsonLd(page) {
    try {
        const raw = await page
            .locator('script[type="application/ld+json"]')
            .first()
            .textContent({ timeout: 2000 });
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Numeric count parsing
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Parses a human-readable count string such as "31", "1.5K comments", "2,300"
 * into an integer.
 */
function parseCount(text) {
    if (!text)
        return undefined;
    // Strip non-numeric characters except for decimal point and 'k'/'K'
    const cleaned = text.toLowerCase().replace(/[^0-9.k]/g, '').trim();
    if (!cleaned)
        return undefined;
    let multiplier = 1;
    let numStr = cleaned;
    if (cleaned.endsWith('k')) {
        multiplier = 1000;
        numStr = cleaned.slice(0, -1);
    }
    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? undefined : Math.round(parsed * multiplier);
}
/**
 * Extracts the reactions/likes count from the data-num-reactions attribute on
 * the reactions anchor — more reliable than parsing inner text.
 */
async function getNumericDataAttribute(page, selector, attribute) {
    try {
        const value = await page.locator(selector).first().getAttribute(attribute);
        if (value) {
            const num = parseInt(value, 10);
            return isNaN(num) ? undefined : num;
        }
    }
    catch {
        // Ignore
    }
    return undefined;
}
// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Parses a public LinkedIn post page and returns structured post data.
 *
 * Extraction priority:
 *  1. JSON-LD structured data (most reliable, server-rendered)
 *  2. data-test-id / data-tracking-control-name DOM selectors
 *  3. Open Graph / Twitter meta tags (fallback)
 */
async function parsePostPage(page, url) {
    // ── 1. JSON-LD (most complete, no layout dependency) ─────────────────────
    //console.log("JSON-LD: ", await page.content());
    const jsonLd = await extractJsonLd(page);
    // ── 2. Author info ────────────────────────────────────────────────────────
    let authorName = jsonLd?.author?.name ||
        (await getText(page, selectors_1.SELECTORS.AUTHOR_NAME));
    let profileUrl = jsonLd?.author?.url ||
        (await getAttribute(page, selectors_1.SELECTORS.AUTHOR_PROFILE, 'href'));
    // Normalise relative profile URLs
    if (profileUrl && !profileUrl.startsWith('http')) {
        profileUrl = `https://www.linkedin.com${profileUrl}`;
    }
    // Strip tracking query params from profile URL if present
    if (profileUrl) {
        try {
            const u = new URL(profileUrl);
            u.searchParams.delete('trk');
            profileUrl = u.toString();
        }
        catch {
            // Keep as-is if URL parsing fails
        }
    }
    // Headline: LinkedIn guest page rarely shows a sub-headline inline.
    // We use the followers line as a proxy (e.g. "14,479 followers"),
    // falling back to a generic label.
    let authorHeadline = await getText(page, selectors_1.SELECTORS.AUTHOR_HEADLINE);
    // ── 3. Post content ───────────────────────────────────────────────────────
    let content = jsonLd?.articleBody ||
        (await getText(page, selectors_1.SELECTORS.CONTENT));
    // ── 4. Media images ───────────────────────────────────────────────────────
    const images = await getAttributeList(page, selectors_1.SELECTORS.IMAGES, 'src');
    // ── 5. Engagement metrics ─────────────────────────────────────────────────
    // Likes/reactions — prefer data-num-reactions attribute (exact int)
    let likes = await getNumericDataAttribute(page, 'a[data-test-id="social-actions__reactions"]', 'data-num-reactions');
    // If attribute approach failed, try JSON-LD interactionStatistic
    if (likes === undefined && jsonLd?.interactionStatistic) {
        const likeEntry = jsonLd.interactionStatistic.find((s) => s.interactionType?.includes('LikeAction'));
        likes = likeEntry?.userInteractionCount;
    }
    // Fall back to parsing the text inside the reaction count span
    if (likes === undefined) {
        const likesText = await getText(page, selectors_1.SELECTORS.LIKES_COUNT);
        likes = parseCount(likesText);
    }
    // Comments — prefer data-num-comments attribute (exact int)
    let comments = await getNumericDataAttribute(page, 'a[data-test-id="social-actions__comments"]', 'data-num-comments');
    // Fall back to JSON-LD commentCount
    if (comments === undefined && jsonLd?.commentCount !== undefined) {
        comments = jsonLd.commentCount;
    }
    // Fall back to parsing comments text
    if (comments === undefined) {
        const commentsText = await getText(page, selectors_1.SELECTORS.COMMENTS_COUNT);
        comments = parseCount(commentsText);
    }
    // ── 6. Date / timestamp ───────────────────────────────────────────────────
    // JSON-LD provides an ISO timestamp; DOM shows relative text ("1d", "2w").
    let postedAt = jsonLd?.datePublished ||
        (await getText(page, selectors_1.SELECTORS.DATE));
    // ── 7. Open Graph / meta-tag fallbacks ───────────────────────────────────
    if (!authorName) {
        const ogTitle = await getMetaContent(page, 'og:title');
        if (ogTitle) {
            // OG title format: "Post text... | Author Name"
            // Try "| Author" split first
            const pipeParts = ogTitle.split(' | ');
            if (pipeParts.length > 1) {
                authorName = pipeParts[pipeParts.length - 1].trim();
            }
            else {
                // Older format: "Author Name on LinkedIn: post text..."
                const onLinkedIn = ogTitle.split(' on LinkedIn')[0];
                if (onLinkedIn && onLinkedIn.trim()) {
                    authorName = onLinkedIn.trim();
                }
            }
        }
        if (!authorName) {
            const pageTitle = await page.title();
            if (pageTitle) {
                const pipeParts = pageTitle.split(' | ');
                if (pipeParts.length > 1) {
                    authorName = pipeParts[pipeParts.length - 1].trim();
                }
                else if (pageTitle.includes(' on LinkedIn')) {
                    authorName = pageTitle.split(' on LinkedIn')[0].trim();
                }
            }
        }
    }
    if (!content) {
        content = await getMetaContent(page, 'og:description');
    }
    if (images.length === 0) {
        const ogImage = await getMetaContent(page, 'og:image');
        if (ogImage) {
            images.push(ogImage);
        }
    }
    // ── 8. Final defaults ─────────────────────────────────────────────────────
    if (!authorName) {
        authorName = 'LinkedIn Member';
    }
    if (!content) {
        content = '';
    }
    return {
        url,
        author: {
            name: authorName,
            headline: authorHeadline || undefined,
            profileUrl,
        },
        content,
        images,
        likes: likes ?? 0,
        comments: comments ?? 0,
        postedAt: postedAt || 'Recently',
        scrapedAt: new Date().toISOString(),
    };
}
/**
 * Scrape every JSON-LD block from the page.
 */
async function parseJsonLd(page) {
    const scripts = await page.$$eval('script[type="application/ld+json"]', (elements) => elements
        .map((el) => el.textContent ?? '')
        .filter(Boolean));
    const objects = [];
    for (const script of scripts) {
        try {
            const parsed = JSON.parse(script);
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (item && typeof item === 'object') {
                        objects.push(item);
                    }
                }
            }
            else if (parsed && typeof parsed === 'object') {
                objects.push(parsed);
            }
        }
        catch {
            // Ignore malformed JSON-LD
        }
    }
    const socialMediaPosting = objects.find((obj) => obj['@type'] === 'SocialMediaPosting');
    return {
        exists: objects.length > 0,
        objects,
        socialMediaPosting,
        scripts,
    };
}

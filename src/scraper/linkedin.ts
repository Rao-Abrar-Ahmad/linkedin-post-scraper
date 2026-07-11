import { BrowserManager } from './browser';
import { parsePostPage } from './parser';
import { ScrapedPost, ScraperException } from './types';
import { normalizeLinkedInUrl } from './validator';

/**
 * Scrapes a public LinkedIn post by opening a browser page, navigating,
 * handling auth walls, and extracting the post details.
 */
export async function scrapeLinkedInPost(rawUrl: string): Promise<ScrapedPost> {
  const url = normalizeLinkedInUrl(rawUrl);
  const browserManager = BrowserManager.getInstance();
  const { context, page } = await browserManager.createPage();

  try {
    console.log(`Scraping URL: ${url}`);

    // Navigate with a timeout of 30 seconds, wait until network is idle
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    }).catch((err) => {
      throw new ScraperException('NETWORK_ERROR', `Failed to load page: ${err.message}`);
    });

    if (!response) {
      throw new ScraperException('NETWORK_ERROR', 'No response received from LinkedIn.');
    }

    const statusCode = response.status();
    if (statusCode === 404) {
      throw new ScraperException('POST_NOT_FOUND', 'The requested LinkedIn post was not found (404).');
    }
    if (statusCode === 999 || statusCode === 403) {
      throw new ScraperException('LINKEDIN_BLOCKED', 'LinkedIn blocked the request (Anti-bot detection triggered).');
    }

    // Give page JS a moment to execute
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Loaded URL: ${currentUrl}`);

    // Check for redirection to Login / Signup walls
    if (currentUrl.includes('/login') || currentUrl.includes('/signup') || currentUrl.includes('/checkpoint/lg/login')) {
      throw new ScraperException('LOGIN_REQUIRED', 'LinkedIn redirected to a login wall. Credentials are required to view this post.');
    }

    // Check for Captcha / Security Challenge
    if (currentUrl.includes('/checkpoint/challenge') || currentUrl.includes('security-verification')) {
      throw new ScraperException('CAPTCHA_REQUIRED', 'LinkedIn triggered a security verification CAPTCHA.');
    }

    const bodyContent = await page.content();

    // Check for standard captcha elements in body
    // if (
    //   bodyContent.includes('challenge-container') ||
    //   bodyContent.includes('recaptcha') ||
    //   bodyContent.includes('arkose') ||
    //   (await page.locator('iframe[src*="captcha"], #captcha, #arkose').count()) > 0
    // ) {
    //   throw new ScraperException('CAPTCHA_REQUIRED', 'LinkedIn security check (CAPTCHA) detected in the page.');
    // }

    // Check for common login wall container elements in the body
    if (
      (await page.locator('.login-form, #login-submit, #username, #password').count()) > 0
    ) {
      throw new ScraperException('LOGIN_REQUIRED', 'LinkedIn login form detected on the page.');
    }

    // Check for "Post not found" elements
    const pageTitle = await page.title();
    if (
      pageTitle.includes('Page Not Found') ||
      pageTitle.includes('LinkedIn: Log In or Sign Up') ||
      bodyContent.includes('Page not found') ||
      bodyContent.includes('Post not found') ||
      bodyContent.includes('no longer available')
    ) {
      throw new ScraperException('POST_NOT_FOUND', 'This post is not found or is no longer available to public viewers.');
    }

    // Ensure we have some content container visible before parsing
    try {
      // Wait for the article card, JSON-LD script, or core-rail wrapper —
      // all three are present in the actual guest-page response.
      await page.waitForSelector(
        'article.main-feed-activity-card, script[type="application/ld+json"], .core-rail',
        { timeout: 5000 }
      );
    } catch (e) {
      // If we can't find structural containers, we still try parsing (relying on meta-tags fallback)
      console.warn('Post container selector not found, proceeding to parse via fallback selectors.');
    }

    // Perform DOM and Metadata parsing
    const postData = await parsePostPage(page, url);
    return postData;

  } catch (error) {
    if (error instanceof ScraperException) {
      throw error;
    }

    // Wrap generic errors
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('timeout') || errMsg.includes('Timeout')) {
      throw new ScraperException('SCRAPE_TIMEOUT', 'The scraping process timed out while loading the page.');
    }
    throw new ScraperException('INTERNAL_ERROR', `An unexpected error occurred during scraping: ${errMsg}`);
  } finally {
    // Always close browser contexts to prevent memory leaks
    await context.close();
  }
}

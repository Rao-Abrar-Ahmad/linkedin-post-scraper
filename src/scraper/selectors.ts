/**
 * CSS / attribute selectors for the LinkedIn public post page.
 *
 * These are derived from the actual rendered HTML returned by the
 * guest-facing "feedcontent-guest-frontend" view (confirmed against
 * example.html as of 2026-07).
 *
 * Primary selectors target data-test-id / data-tracking-control-name
 * attributes because those are far more stable than volatile Tailwind
 * utility class strings.  BEM class names are kept as secondary
 * fall-backs where they still appear in the real page.
 */
export const SELECTORS = {
  // ──────────────────────────────────────────────────────────────────
  // Author name
  // Primary:  the anchor that wraps the author name text inside the
  //           main feed activity card actor-lockup section.
  // ──────────────────────────────────────────────────────────────────
  AUTHOR_NAME: [
    'a[data-tracking-control-name="public_post_feed-actor-name"]',
    // sidebar author card — h1 variant used on some posts
    'h1.section-title',
    // legacy BEM class names kept as last resort
    '.feed-shared-actor__name',
    '.update-components-actor__title',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Author headline / tagline
  // LinkedIn's guest page does NOT always render a sub-headline for
  // the author inline.  The sidebar author card sometimes shows
  // followers count instead.  Selectors are provided for pages that
  // do include it; the fallback in parser.ts handles the missing case.
  // ──────────────────────────────────────────────────────────────────
  AUTHOR_HEADLINE: [
    // followers line inside public-post-author-card (right rail)
    '.public-post-author-card__followers',
    // legacy BEM
    '.feed-shared-actor__description',
    '.update-components-actor__description',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Author profile URL
  // ──────────────────────────────────────────────────────────────────
  AUTHOR_PROFILE: [
    'a[data-tracking-control-name="public_post_feed-actor-name"]',
    'a[data-tracking-control-name="public_post_feed-actor-image"]',
    // sidebar "View Profile" CTA
    '.public-post-author-card__view-profile',
    // legacy
    'a[data-tracking-control-name="public_post_actor-name"]',
    'a[data-tracking-control-name="public_post_actor-image"]',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Post body text
  // Primary:  <p data-test-id="main-feed-activity-card__commentary">
  // ──────────────────────────────────────────────────────────────────
  CONTENT: [
    'p[data-test-id="main-feed-activity-card__commentary"]',
    // container div wrapping the <p>
    '.attributed-text-segment-list__container p',
    // legacy / older page templates
    '.feed-shared-update-v2__commentary',
    '.feed-shared-text-view',
    '.update-components-text',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Images attached to the post
  // ──────────────────────────────────────────────────────────────────
  IMAGES: [
    // images inside the article card but NOT reaction emoji / avatar images
    'article.main-feed-activity-card img[src*="licdn.com/dms/image"]',
    // legacy selectors
    '.feed-shared-image-element img',
    '.update-components-image img',
    'img[src*="licdn.com/media"]',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Reactions / Likes count
  // Primary:  <span data-test-id="social-actions__reaction-count">
  //           The anchor also carries data-num-reactions attribute.
  // ──────────────────────────────────────────────────────────────────
  LIKES_COUNT: [
    'span[data-test-id="social-actions__reaction-count"]',
    'a[data-test-id="social-actions__reactions"]',
    // legacy BEM
    '.social-details-social-counts__reactions-count',
    '.reactions-count',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Comments count
  // Primary:  <a data-test-id="social-actions__comments">
  //           contains text like "3 Comments"
  // ──────────────────────────────────────────────────────────────────
  COMMENTS_COUNT: [
    'a[data-test-id="social-actions__comments"]',
    // legacy BEM
    '.social-details-social-counts__comments',
  ],

  // ──────────────────────────────────────────────────────────────────
  // Post timestamp
  // Primary:  <time> inside the actor-lockup section of the article
  // ──────────────────────────────────────────────────────────────────
  DATE: [
    'article.main-feed-activity-card time',
    // legacy
    '.feed-shared-actor__subtext',
    '.update-components-actor__subtext',
  ],
};

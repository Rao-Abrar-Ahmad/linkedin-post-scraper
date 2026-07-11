"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SELECTORS = void 0;
exports.SELECTORS = {
    // Author name selectors
    AUTHOR_NAME: [
        '.feed-shared-actor__name',
        '.main-feed-card__author-name',
        'span.feed-shared-actor__title',
        '.update-components-actor__title',
        'a[data-tracking-control-name="public_post_actor-name"] span',
        'h3.update-components-actor__title',
        '.post-author__name'
    ],
    // Author headline/description selectors
    AUTHOR_HEADLINE: [
        '.feed-shared-actor__description',
        '.main-feed-card__author-headline',
        '.update-components-actor__description',
        'span.feed-shared-actor__description',
        '.post-author__headline'
    ],
    // Author profile link selectors
    AUTHOR_PROFILE: [
        'a[data-tracking-control-name="public_post_actor-image"]',
        'a[data-tracking-control-name="public_post_actor-name"]',
        'a.update-components-actor__meta-link',
        'a.feed-shared-actor__image-link',
        '.post-author__link'
    ],
    // Main text commentary of the post
    CONTENT: [
        '.feed-shared-update-v2__commentary',
        '.feed-shared-text-view',
        '.update-components-text',
        '.feed-shared-update-v2__description-wrapper',
        '.feed-shared-text',
        '.post-content__text',
        'span.break-words'
    ],
    // Image selectors in the post card
    IMAGES: [
        '.feed-shared-image-element img',
        '.update-components-image img',
        '.feed-shared-update-v2__content img',
        '.update-components-article__image img',
        'img.feed-shared-image-element__image',
        'img[src*="licdn.com/media"]'
    ],
    // Likes / Reactions count selectors
    LIKES_COUNT: [
        '.social-details-social-counts__reactions-count',
        '.reactions-count',
        'button[aria-label*="like"] .social-details-social-counts__social-num',
        'span.v-align-middle[aria-hidden="true"]',
        '.social-action-bar__likes'
    ],
    // Comments count selectors
    COMMENTS_COUNT: [
        '.social-details-social-counts__comments',
        'button[aria-label*="comment"]',
        '.social-details-social-counts__social-num[aria-label*="comment"]',
        '.social-action-bar__comments'
    ],
    // Timestamp selectors
    DATE: [
        '.feed-shared-actor__subtext',
        'span.feed-shared-actor__subtext',
        '.update-components-actor__subtext',
        '.main-feed-card__time-ago'
    ]
};

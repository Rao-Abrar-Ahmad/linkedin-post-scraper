export interface ScrapedPost {
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

export type ErrorCode =
  | 'INVALID_URL'
  | 'POST_NOT_FOUND'
  | 'LOGIN_REQUIRED'
  | 'CAPTCHA_REQUIRED'
  | 'SCRAPE_TIMEOUT'
  | 'LINKEDIN_BLOCKED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR';

export class ScraperException extends Error {
  public code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ScraperException';
    this.code = code;
    Object.setPrototypeOf(this, ScraperException.prototype);
  }
}

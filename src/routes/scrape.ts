import { Router, Request, Response, NextFunction } from 'express';
import { scrapeLinkedInPost } from '../scraper/linkedin';
import { ScraperException } from '../scraper/types';

const router = Router();

// Express async handler wrapper to catch async exceptions
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post(
  '/scrape',
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      throw new ScraperException('INVALID_URL', 'The URL parameter is required and must be a string.');
    }

    console.log(`[API] Received scrape request for URL: ${url}`);
    const postData = await scrapeLinkedInPost(url);

    res.status(200).json({
      success: true,
      data: postData
    });
  })
);

export default router;

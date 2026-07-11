import express from 'express';
import cors from 'cors';
import path from 'path';
import scrapeRouter from './routes/scrape';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// API routing
app.use('/api', scrapeRouter);

// Serve React production build static assets from 'public' folder
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to React index.html for non-API client routes
app.get('*', (req, res, next) => {
  // If the request is for API, pass it down (will result in 404 or match nothing)
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

export default app;

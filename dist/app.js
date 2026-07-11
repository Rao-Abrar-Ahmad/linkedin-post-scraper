"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const scrape_1 = __importDefault(require("./routes/scrape"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Standard middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API routing
app.use('/api', scrape_1.default);
// Serve React production build static assets from 'public' folder
const publicPath = path_1.default.join(__dirname, 'public');
app.use(express_1.default.static(publicPath));
// Fallback to React index.html for non-API client routes
app.get('*', (req, res, next) => {
    // If the request is for API, pass it down (will result in 404 or match nothing)
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
// Centralized error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const types_1 = require("../scraper/types");
function errorHandler(err, req, res, next) {
    console.error(`[Error Handler] Catched error:`, err);
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected internal server error occurred.';
    if (err instanceof types_1.ScraperException) {
        code = err.code;
        message = err.message;
        switch (err.code) {
            case 'INVALID_URL':
                status = 400;
                break;
            case 'POST_NOT_FOUND':
                status = 404;
                break;
            case 'LOGIN_REQUIRED':
                status = 401;
                break;
            case 'CAPTCHA_REQUIRED':
            case 'LINKEDIN_BLOCKED':
                status = 403;
                break;
            case 'SCRAPE_TIMEOUT':
                status = 544; // Custom gateway timeout indicator or 504
                status = 504;
                break;
            case 'NETWORK_ERROR':
                status = 502;
                break;
            case 'INTERNAL_ERROR':
            default:
                status = 500;
                break;
        }
    }
    else if (err instanceof Error) {
        message = err.message;
    }
    const responseBody = {
        success: false,
        error: {
            code,
            message
        }
    };
    res.status(status).json(responseBody);
}

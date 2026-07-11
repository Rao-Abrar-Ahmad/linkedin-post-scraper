"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperException = void 0;
class ScraperException extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'ScraperException';
        this.code = code;
        Object.setPrototypeOf(this, ScraperException.prototype);
    }
}
exports.ScraperException = ScraperException;

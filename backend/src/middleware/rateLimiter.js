const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    skipSuccessfulRequests: true, // Successful logins never count against brute force limits
    message: { error: 'Too many failed login attempts. Please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    skipSuccessfulRequests: false,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many upload attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const quizLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: { error: 'Too many quiz submissions, please wait before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const postLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many posts created, please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter, uploadLimiter, quizLimiter, postLimiter };


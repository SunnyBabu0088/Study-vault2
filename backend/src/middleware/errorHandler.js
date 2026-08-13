const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // In production, don't expose internal error details
    const message = env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : (err.message || 'Internal server error');

    if (env.NODE_ENV !== 'test') {
        console.error(`[${req.method}] ${req.originalUrl}`, err);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(env.NODE_ENV !== 'production' && { details: err.details || null }),
    });
};

module.exports = errorHandler;

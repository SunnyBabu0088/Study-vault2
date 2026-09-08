const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // In production, don't expose internal error details for 500
    const rawMessage = err.message || 'Internal server error';
    const message = (env.NODE_ENV === 'production' && statusCode === 500)
        ? 'Internal server error'
        : rawMessage;

    if (env.NODE_ENV !== 'test') {
        console.error(`[${req.method}] ${req.originalUrl}`, err);
    }

    const code = err.code || (
        statusCode === 400 ? 'VALIDATION_ERROR' :
        statusCode === 401 ? 'UNAUTHORIZED' :
        statusCode === 403 ? 'FORBIDDEN' :
        statusCode === 404 ? 'NOT_FOUND' :
        statusCode === 409 ? 'CONFLICT' : 'INTERNAL_ERROR'
    );

    const errorPayload = {
        code,
        message,
        ...(err.details || (env.NODE_ENV !== 'production' && err.stack ? { details: err.details || null } : {})),
    };

    res.status(statusCode).json({
        success: false,
        error: errorPayload,
    });
};

module.exports = errorHandler;


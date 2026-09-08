const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, data });
};

const sendCreated = (res, data) => sendSuccess(res, data, 201);

const sendError = (res, message, statusCode = 500, details = null, code = null) => {
    const errorPayload = typeof message === 'object' ? message : {
        code: code || (statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 401 ? 'UNAUTHORIZED' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 409 ? 'CONFLICT' : 'INTERNAL_ERROR'),
        message: String(message),
        ...(details ? { details } : {})
    };
    return res.status(statusCode).json({ success: false, error: errorPayload });
};

module.exports = { sendSuccess, sendCreated, sendError };


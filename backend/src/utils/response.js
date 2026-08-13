const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({ success: true, data });
};

const sendCreated = (res, data) => sendSuccess(res, data, 201);

const sendError = (res, message, statusCode = 500) => {
    return res.status(statusCode).json({ success: false, error: message });
};

module.exports = { sendSuccess, sendCreated, sendError };

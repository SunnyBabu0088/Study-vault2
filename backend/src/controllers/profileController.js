const userService = require('../services/userService');
const { validateProfilePayload, normalizeUserResponse } = require('../utils/validators');
const { sendSuccess } = require('../utils/response');

const getProfile = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { profile: normalizeUserResponse(user) });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateProfilePayload(req.body);
        if (!valid) {
            const errorMsg = Object.values(errors).join(' ') || 'Validation failed';
            const error = new Error(errorMsg);
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const existing = await userService.getUserByEmail(sanitized.email);
        if (existing && existing.id !== req.user.id) {
            const error = new Error('Email already in use');
            error.statusCode = 409;
            throw error;
        }

        const user = await userService.updateUser(req.user.id, {
            username: sanitized.username,
            email: sanitized.email,
            phone: sanitized.phone,
            rollNumber: sanitized.roll_number,
            bio: sanitized.bio,
            avatarUrl: sanitized.avatar_url,
        });

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { profile: normalizeUserResponse(user) });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile };
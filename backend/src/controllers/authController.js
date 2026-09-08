const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { signToken } = require('../utils/jwt');
const { validateRegistration, validateLogin, normalizeUserResponse } = require('../utils/validators');
const userService = require('../services/userService');
const { sendSuccess, sendCreated } = require('../utils/response');
const env = require('../config/env');

const createAuthCookie = (res, token) => {
    const secure = env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });
};

const register = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateRegistration(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const existing = await userService.getUserByEmail(sanitized.email);
        if (existing) {
            const error = new Error('Email already in use');
            error.statusCode = 409;
            throw error;
        }

        const passwordHash = await bcrypt.hash(sanitized.password, 12);
        const user = await userService.createUser({
            id: crypto.randomUUID(),
            username: sanitized.username,
            email: sanitized.email,
            passwordHash,
            phone: sanitized.phone,
            rollNumber: sanitized.roll_number,
            avatarUrl: sanitized.avatar_url,
        });

        const token = signToken({ userId: user.id, email: user.email });
        createAuthCookie(res, token);
        return sendCreated(res, { user: normalizeUserResponse(user), token });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateLogin(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const user = await userService.getUserByEmail(sanitized.email);
        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(sanitized.password, user.password_hash);
        if (!isMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        const token = signToken({ userId: user.id, email: user.email });
        createAuthCookie(res, token);
        return sendSuccess(res, { user: normalizeUserResponse(user), token });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res) => {
    const secure = env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
    });
    return sendSuccess(res, { message: 'Logged out successfully' });
};

const me = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }

        const user = await userService.getUserById(req.user.id);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { user: normalizeUserResponse(user) });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            const error = new Error('Email is required');
            error.statusCode = 400;
            throw error;
        }

        const resetData = await userService.createPasswordResetToken(email.trim().toLowerCase());
        return sendSuccess(res, {
            message: 'If an account exists with that email, password reset instructions have been processed.',
            token: resetData ? resetData.token : null, // Provided for direct verification
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword || newPassword.length < 8) {
            const error = new Error('Valid reset token and new password (min 8 characters) are required.');
            error.statusCode = 400;
            throw error;
        }

        const success = await userService.resetPasswordWithToken(token, newPassword);
        if (!success) {
            const error = new Error('Invalid or expired password reset token.');
            error.statusCode = 400;
            throw error;
        }

        return sendSuccess(res, { message: 'Password has been reset successfully. Please log in with your new password.' });
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        if (!req.user) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }

        await userService.deleteUser(req.user.id);

        const secure = env.NODE_ENV === 'production';
        res.clearCookie('token', {
            httpOnly: true,
            secure,
            sameSite: 'lax',
            path: '/',
        });

        return sendSuccess(res, { message: 'Account and associated data deleted permanently.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, me, forgotPassword, resetPassword, deleteAccount };

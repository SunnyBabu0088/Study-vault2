const { verifyToken } = require('../utils/jwt');
const userService = require('../services/userService');

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            const error = new Error('Authentication token missing');
            error.statusCode = 401;
            return next(error);
        }

        const payload = verifyToken(token);
        if (!payload || !payload.userId) {
            const error = new Error('Invalid authentication token');
            error.statusCode = 401;
            return next(error);
        }

        const user = await userService.getUserById(payload.userId);
        if (!user) {
            const error = new Error('User no longer exists');
            error.statusCode = 401;
            return next(error);
        }

        req.user = { id: user.id, email: user.email };
        return next();
    } catch (error) {
        const authError = new Error('Expired or invalid authentication token');
        authError.statusCode = 401;
        return next(authError);
    }
};

module.exports = { requireAuth };

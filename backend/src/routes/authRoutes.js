const express = require('express');
const { register, login, logout, me, forgotPassword, resetPassword, deleteAccount } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;

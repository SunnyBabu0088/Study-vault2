const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getSummary,
    startSession,
    heartbeatSession,
    updateProgress,
    getQuiz,
    submitQuiz,
    getAnalytics,
} = require('../controllers/vaultController');

const { quizLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', getSummary);
router.post('/study-sessions', startSession);
router.patch('/study-sessions/:id/heartbeat', heartbeatSession);
router.post('/material-progress', updateProgress);

router.get('/daily-quiz', getQuiz);
router.post('/daily-quiz/submit', quizLimiter, submitQuiz);
router.get('/analytics', getAnalytics);

module.exports = router;

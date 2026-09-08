const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

router.use(requireAuth);

router.post('/chat', aiController.chat);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:conversationId/messages', aiController.getMessages);
router.delete('/conversations/:conversationId', aiController.deleteConversation);
router.get('/images', aiController.getImages);
router.get('/quizzes', aiController.getQuizzes);
router.post('/quizzes', aiController.saveQuiz);

module.exports = router;

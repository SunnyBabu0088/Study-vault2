const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { listConversations, createConversation } = require('../controllers/conversationController');
const { listMessages, createMessage, markMessageRead } = require('../controllers/messageController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listConversations);
router.post('/', createConversation);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', createMessage);
router.patch('/messages/:id/read', markMessageRead);

module.exports = router;

const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { listMessages, createMessage, markMessageRead } = require('../controllers/messageController');

const router = express.Router();

router.use(requireAuth);
router.get('/conversations/:id/messages', listMessages);
router.post('/conversations/:id/messages', createMessage);
router.patch('/messages/:id/read', markMessageRead);

module.exports = router;

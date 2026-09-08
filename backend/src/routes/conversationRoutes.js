const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { listConversations, createConversation } = require('../controllers/conversationController');
const { listMessages, createMessage, markMessageRead } = require('../controllers/messageController');
const {
    getSettings,
    updateTheme,
    updateNickname,
    updateMute,
    clearConversation,
    searchMessages,
    createCall,
    updateCall,
} = require('../controllers/conversationSettingsController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listConversations);
router.post('/', createConversation);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', createMessage);
router.patch('/messages/:id/read', markMessageRead);

// Per-conversation settings
router.get('/:id/settings', getSettings);
router.put('/:id/theme', updateTheme);
router.put('/:id/nickname', updateNickname);
router.post('/:id/mute', updateMute);
router.post('/:id/clear', clearConversation);
router.get('/:id/search', searchMessages);

// Call sessions
router.post('/calls/session', createCall);
router.patch('/calls/session/:id', updateCall);

module.exports = router;

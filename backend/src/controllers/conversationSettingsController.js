const conversationSettingsService = require('../services/conversationSettingsService');
const callService = require('../services/callService');
const conversationService = require('../services/conversationService');
const { sendSuccess, sendError } = require('../utils/response');

const getSettings = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const settings = await conversationSettingsService.getSettings(conversationId, userId);
        return sendSuccess(res, { settings });
    } catch (error) {
        next(error);
    }
};

const updateTheme = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;
        const { theme_id } = req.body;

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const settings = await conversationSettingsService.updateTheme(conversationId, userId, theme_id);
        return sendSuccess(res, { settings, message: 'Chat theme updated' });
    } catch (error) {
        next(error);
    }
};

const updateNickname = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;
        const { nickname } = req.body;

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const settings = await conversationSettingsService.updateNickname(conversationId, userId, nickname);
        return sendSuccess(res, { settings, message: 'Nickname updated' });
    } catch (error) {
        next(error);
    }
};

const updateMute = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;
        const { duration } = req.body; // '6h', '12h', '1d', '1w', 'unmute'

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const settings = await conversationSettingsService.updateMute(conversationId, userId, duration);
        return sendSuccess(res, { settings, message: 'Mute settings updated' });
    } catch (error) {
        next(error);
    }
};

const clearConversation = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const result = await conversationSettingsService.clearConversation(conversationId, userId);
        return sendSuccess(res, result, 'Conversation cleared');
    } catch (error) {
        next(error);
    }
};

const searchMessages = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;
        const query = req.query.q || '';

        const conversation = await conversationService.getConversationById(userId, conversationId);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const results = await conversationSettingsService.searchMessages(conversationId, query);
        return sendSuccess(res, { messages: results, query });
    } catch (error) {
        next(error);
    }
};

const createCall = async (req, res, next) => {
    try {
        const { conversation_id, receiver_id, call_type } = req.body;
        const callerId = req.user.id;

        const conversation = await conversationService.getConversationById(callerId, conversation_id);
        if (!conversation) {
            return sendError(res, 'Conversation not found or access denied', 404);
        }

        const call = await callService.createCallSession(conversation_id, callerId, receiver_id, call_type);
        return sendSuccess(res, { call });
    } catch (error) {
        next(error);
    }
};

const updateCall = async (req, res, next) => {
    try {
        const callId = req.params.id;
        const { status, duration_seconds } = req.body;

        const call = await callService.updateCallSession(callId, status, duration_seconds);
        return sendSuccess(res, { call });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateTheme,
    updateNickname,
    updateMute,
    clearConversation,
    searchMessages,
    createCall,
    updateCall,
};

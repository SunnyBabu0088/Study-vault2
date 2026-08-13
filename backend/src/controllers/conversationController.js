const conversationService = require('../services/conversationService');
const { validateConversationPayload, validateIdParam } = require('../utils/validators');
const { sendSuccess, sendCreated } = require('../utils/response');

const listConversations = async (req, res, next) => {
    try {
        const conversations = await conversationService.getConversationsForUser(req.user.id);
        return sendSuccess(res, { conversations });
    } catch (error) {
        next(error);
    }
};

const getConversation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid conversation id');
            error.statusCode = 400;
            throw error;
        }

        const conversation = await conversationService.getConversationById(req.user.id, id);
        if (!conversation) {
            const error = new Error('Conversation not found');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { conversation });
    } catch (error) {
        next(error);
    }
};

const createConversation = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateConversationPayload(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const conversation = await conversationService.getOrCreateConversation(req.user.id, sanitized.participants);
        return sendCreated(res, { conversation });
    } catch (error) {
        next(error);
    }
};

module.exports = { listConversations, getConversation, createConversation };
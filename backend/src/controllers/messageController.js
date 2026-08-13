const messageService = require('../services/messageService');
const conversationService = require('../services/conversationService');
const { validateMessagePayload, validateIdParam } = require('../utils/validators');
const { sendSuccess, sendCreated } = require('../utils/response');

const listMessages = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        if (!validateIdParam(conversationId)) {
            const error = new Error('Invalid conversation id');
            error.statusCode = 400;
            throw error;
        }

        const conversation = await conversationService.getConversationById(req.user.id, conversationId);
        if (!conversation) {
            const error = new Error('Conversation not found');
            error.statusCode = 404;
            throw error;
        }

        const messages = await messageService.getMessagesForConversation(req.user.id, conversationId);
        return sendSuccess(res, { messages });
    } catch (error) {
        next(error);
    }
};

const createMessage = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        if (!validateIdParam(conversationId)) {
            const error = new Error('Invalid conversation id');
            error.statusCode = 400;
            throw error;
        }

        const conversation = await conversationService.getConversationById(req.user.id, conversationId);
        if (!conversation) {
            const error = new Error('Conversation not found');
            error.statusCode = 404;
            throw error;
        }

        const { valid, errors, sanitized } = validateMessagePayload(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const message = await messageService.createAndPersistMessage(req.user.id, conversationId, sanitized.content);
        return sendCreated(res, { message });
    } catch (error) {
        next(error);
    }
};

const markMessageRead = async (req, res, next) => {
    try {
        const messageId = req.params.id;
        if (!validateIdParam(messageId)) {
            const error = new Error('Invalid message id');
            error.statusCode = 400;
            throw error;
        }

        const message = await messageService.markMessageRead(req.user.id, messageId);
        if (!message) {
            const error = new Error('Message not found or not accessible');
            error.statusCode = 404;
            throw error;
        }

        return sendSuccess(res, { message });
    } catch (error) {
        next(error);
    }
};

module.exports = { listMessages, createMessage, markMessageRead };
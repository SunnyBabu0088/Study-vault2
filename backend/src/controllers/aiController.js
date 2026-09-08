const aiService = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/response');

const chat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId, message, mode, attachedFile, options } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 'Message text is required', 400);
    }

    const response = await aiService.processChatMessage(userId, {
      conversationId,
      message,
      mode: mode || 'AI',
      attachedFile,
      options,
    });

    return sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await aiService.getUserConversations(userId);
    return sendSuccess(res, { conversations });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const messages = await aiService.getConversationMessages(userId, conversationId);
    return sendSuccess(res, { messages });
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    await aiService.deleteConversation(userId, conversationId);
    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
};

const getImages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const images = await aiService.getUserGeneratedImages(userId);
    return sendSuccess(res, { images });
  } catch (error) {
    next(error);
  }
};

const getQuizzes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const quizzes = await aiService.getUserQuizHistory(userId);
    return sendSuccess(res, { quizzes });
  } catch (error) {
    next(error);
  }
};

const saveQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await aiService.saveQuizResult(userId, req.body);
    return sendSuccess(res, { result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
  getConversations,
  getMessages,
  deleteConversation,
  getImages,
  getQuizzes,
  saveQuiz,
};

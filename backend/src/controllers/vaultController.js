const vaultService = require('../services/vaultService');
const { sendSuccess, sendError } = require('../utils/response');

const getSummary = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const summary = await vaultService.getVaultSummary(userId);
        return sendSuccess(res, summary);
    } catch (error) {
        next(error);
    }
};

const startSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const session = await vaultService.startStudySession(userId, req.body);
        return sendSuccess(res, { session });
    } catch (error) {
        next(error);
    }
};

const heartbeatSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const sessionId = req.params.id;
        const session = await vaultService.heartbeatStudySession(userId, sessionId, req.body);
        return sendSuccess(res, { session });
    } catch (error) {
        next(error);
    }
};

const updateProgress = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const progress = await vaultService.updateMaterialProgress(userId, req.body);
        return sendSuccess(res, { progress });
    } catch (error) {
        next(error);
    }
};

const getQuiz = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const quizData = await vaultService.getDailyQuiz(userId);
        return sendSuccess(res, quizData);
    } catch (error) {
        next(error);
    }
};

const submitQuiz = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quiz_id, level, answers } = req.body;
        const result = await vaultService.submitQuizAnswers(userId, { quiz_id, level, answers });
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const analytics = await vaultService.getVaultAnalytics(userId);
        return sendSuccess(res, analytics);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSummary,
    startSession,
    heartbeatSession,
    updateProgress,
    getQuiz,
    submitQuiz,
    getAnalytics,
};

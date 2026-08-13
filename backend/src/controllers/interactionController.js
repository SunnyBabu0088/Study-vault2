const interactionService = require('../services/interactionService');
const { validateSuggestionPayload, validateIdParam } = require('../utils/validators');
const { sendSuccess } = require('../utils/response');

const likePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const result = await interactionService.likePost(req.user.id, id);
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const unlikePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const result = await interactionService.unlikePost(req.user.id, id);
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const savePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const result = await interactionService.savePost(req.user.id, id);
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const unsavePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const result = await interactionService.unsavePost(req.user.id, id);
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const addSuggestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const { valid, errors, sanitized } = validateSuggestionPayload(req.body);
        if (!valid) {
            const error = new Error('Validation failed');
            error.statusCode = 400;
            error.details = errors;
            throw error;
        }

        const suggestion = await interactionService.addSuggestion(req.user.id, id, sanitized.content);
        return sendSuccess(res, { suggestion }, 201);
    } catch (error) {
        next(error);
    }
};

const getSuggestions = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            const error = new Error('Invalid post id');
            error.statusCode = 400;
            throw error;
        }

        const suggestions = await interactionService.getSuggestions(req.user.id, id);
        return sendSuccess(res, { suggestions });
    } catch (error) {
        next(error);
    }
};

module.exports = { likePost, unlikePost, savePost, unsavePost, addSuggestion, getSuggestions };

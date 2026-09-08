const highlightService = require('../services/highlightService');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

const listHighlights = async (req, res, next) => {
    try {
        const highlights = await highlightService.getHighlightsForUser(req.user.id);
        return sendSuccess(res, { highlights });
    } catch (error) {
        next(error);
    }
};

const createHighlight = async (req, res, next) => {
    try {
        const { name, storyIds } = req.body;
        if (!name || !name.trim()) {
            return sendError(res, 'Highlight name is required', 400);
        }
        const highlight = await highlightService.createHighlight(req.user.id, name.trim(), storyIds || []);
        return sendCreated(res, { highlight });
    } catch (error) {
        next(error);
    }
};

const updateHighlight = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) {
            return sendError(res, 'Highlight name is required', 400);
        }
        const highlight = await highlightService.updateHighlight(req.user.id, id, name.trim());
        if (!highlight) {
            return sendError(res, 'Highlight not found', 404);
        }
        return sendSuccess(res, { highlight });
    } catch (error) {
        next(error);
    }
};

const deleteHighlight = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await highlightService.deleteHighlight(req.user.id, id);
        if (!result) {
            return sendError(res, 'Highlight not found', 404);
        }
        return sendSuccess(res, { message: 'Highlight deleted' });
    } catch (error) {
        next(error);
    }
};

const addStory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { storyId } = req.body;
        if (!storyId) {
            return sendError(res, 'Story ID is required', 400);
        }
        const result = await highlightService.addStoryToHighlight(req.user.id, id, storyId);
        return sendSuccess(res, { result });
    } catch (error) {
        next(error);
    }
};

const removeStory = async (req, res, next) => {
    try {
        const { id, storyId } = req.params;
        const result = await highlightService.removeStoryFromHighlight(req.user.id, id, storyId);
        return sendSuccess(res, { result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listHighlights,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    addStory,
    removeStory,
};

const memoryService = require('../services/memoryService');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

const listMemories = async (req, res, next) => {
    try {
        const memories = await memoryService.getMemoriesForUser(req.user.id);
        return sendSuccess(res, { memories, highlights: memories });
    } catch (error) {
        next(error);
    }
};

const createMemory = async (req, res, next) => {
    try {
        const { name, storyIds } = req.body;
        if (!name || !name.trim()) {
            return sendError(res, 'Memory name is required', 400);
        }
        const memory = await memoryService.createMemory(req.user.id, name.trim(), storyIds || []);
        return sendCreated(res, { memory, highlight: memory });
    } catch (error) {
        next(error);
    }
};

const updateMemory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) {
            return sendError(res, 'Memory name is required', 400);
        }
        const memory = await memoryService.updateMemory(req.user.id, id, name.trim());
        if (!memory) {
            return sendError(res, 'Memory not found', 404);
        }
        return sendSuccess(res, { memory, highlight: memory });
    } catch (error) {
        next(error);
    }
};

const deleteMemory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await memoryService.deleteMemory(req.user.id, id);
        if (!result) {
            return sendError(res, 'Memory not found', 404);
        }
        return sendSuccess(res, { message: 'Memory deleted' });
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
        const result = await memoryService.addStoryToMemory(req.user.id, id, storyId);
        return sendSuccess(res, { result });
    } catch (error) {
        next(error);
    }
};

const removeStory = async (req, res, next) => {
    try {
        const { id, storyId } = req.params;
        const result = await memoryService.removeStoryFromMemory(req.user.id, id, storyId);
        return sendSuccess(res, { result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    addStory,
    removeStory,
};

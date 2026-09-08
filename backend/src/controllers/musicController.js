const musicService = require('../services/music/musicService');
const { sendSuccess, sendError } = require('../utils/response');

const search = async (req, res, next) => {
    try {
        const { q, category, language, provider, limit, page } = req.query;
        const results = await musicService.searchTracks({
            query: q,
            category,
            language,
            provider: provider || 'itunes',
            limit: Number(limit) || 25,
            page: Number(page) || 1,
        });
        return sendSuccess(res, results);
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await musicService.getCategories();
        const languages = await musicService.getLanguages();
        return sendSuccess(res, { categories, languages });
    } catch (error) {
        next(error);
    }
};

const getTrending = async (req, res, next) => {
    try {
        const { language, limit } = req.query;
        const results = await musicService.getTrending({
            language,
            limit: Number(limit) || 25,
        });
        return sendSuccess(res, results);
    } catch (error) {
        next(error);
    }
};

const getFavorites = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const favorites = await musicService.getUserFavorites(userId);
        return sendSuccess(res, { favorites });
    } catch (error) {
        next(error);
    }
};

const toggleFavorite = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { provider, trackId, title, artist, artworkUrl, previewUrl } = req.body;
        if (!trackId || !title || !artist) {
            return sendError(res, 'trackId, title, and artist are required', 400);
        }
        const result = await musicService.toggleFavorite(userId, {
            provider: provider || 'itunes',
            trackId,
            title,
            artist,
            artworkUrl,
            previewUrl,
        });
        return sendSuccess(res, result);
    } catch (error) {
        next(error);
    }
};

const getRecent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const recent = await musicService.getUserRecent(userId);
        return sendSuccess(res, { recent });
    } catch (error) {
        next(error);
    }
};

const getAdminSettings = async (req, res, next) => {
    try {
        const settings = await musicService.getProviderSettings();
        return sendSuccess(res, { settings });
    } catch (error) {
        next(error);
    }
};

const updateAdminSettings = async (req, res, next) => {
    try {
        const { provider } = req.params;
        const updated = await musicService.updateProviderSettings(provider, req.body);
        return sendSuccess(res, { settings: updated });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    search,
    getCategories,
    getTrending,
    getFavorites,
    toggleFavorite,
    getRecent,
    getAdminSettings,
    updateAdminSettings,
};

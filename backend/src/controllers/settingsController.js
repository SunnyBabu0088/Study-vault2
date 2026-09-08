const settingsService = require('../services/settingsService');
const { sendSuccess } = require('../utils/response');

const getSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getUserSettings(req.user.id);
        return sendSuccess(res, { settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const updated = await settingsService.updateUserSettings(req.user.id, req.body);
        return sendSuccess(res, { settings: updated });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings,
};

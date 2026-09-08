const privacyService = require('../services/privacyService');
const { sendSuccess } = require('../utils/response');

const getAccountPrivacy = async (req, res, next) => {
    try {
        const data = await privacyService.getAccountPrivacy(req.user.id);
        return sendSuccess(res, data);
    } catch (error) {
        next(error);
    }
};

const updateAccountPrivacy = async (req, res, next) => {
    try {
        const { is_private } = req.body;
        const data = await privacyService.updateAccountPrivacy(req.user.id, is_private);
        return sendSuccess(res, data, 'Account privacy setting updated');
    } catch (error) {
        next(error);
    }
};

const getCloseFriends = async (req, res, next) => {
    try {
        const data = await privacyService.getCloseFriends(req.user.id);
        return sendSuccess(res, data);
    } catch (error) {
        next(error);
    }
};

const addCloseFriend = async (req, res, next) => {
    try {
        const { friend_id } = req.body;
        const data = await privacyService.addCloseFriend(req.user.id, friend_id);
        return sendSuccess(res, data, 'Added to Close Friends');
    } catch (error) {
        next(error);
    }
};

const removeCloseFriend = async (req, res, next) => {
    try {
        const { friendId } = req.params;
        const data = await privacyService.removeCloseFriend(req.user.id, friendId);
        return sendSuccess(res, data, 'Removed from Close Friends');
    } catch (error) {
        next(error);
    }
};

const getBlockedUsers = async (req, res, next) => {
    try {
        const data = await privacyService.getBlockedUsers(req.user.id);
        return sendSuccess(res, data);
    } catch (error) {
        next(error);
    }
};

const blockUser = async (req, res, next) => {
    try {
        const { blocked_user_id } = req.body;
        const data = await privacyService.blockUser(req.user.id, blocked_user_id);
        return sendSuccess(res, data, 'User blocked successfully');
    } catch (error) {
        next(error);
    }
};

const unblockUser = async (req, res, next) => {
    try {
        const { blockedUserId } = req.params;
        const data = await privacyService.unblockUser(req.user.id, blockedUserId);
        return sendSuccess(res, data, 'User unblocked successfully');
    } catch (error) {
        next(error);
    }
};

const getStoryLocationSettings = async (req, res, next) => {
    try {
        const data = await privacyService.getStoryLocationSettings(req.user.id);
        return sendSuccess(res, data);
    } catch (error) {
        next(error);
    }
};

const updateStoryLocationSettings = async (req, res, next) => {
    try {
        const data = await privacyService.updateStoryLocationSettings(req.user.id, req.body);
        return sendSuccess(res, data, 'Story & Location settings updated');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAccountPrivacy,
    updateAccountPrivacy,
    getCloseFriends,
    addCloseFriend,
    removeCloseFriend,
    getBlockedUsers,
    blockUser,
    unblockUser,
    getStoryLocationSettings,
    updateStoryLocationSettings,
};

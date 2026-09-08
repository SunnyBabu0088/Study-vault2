const { pool } = require('../config/database');

const getAccountPrivacy = async (userId) => {
    const res = await pool.query('SELECT is_private FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
        throw new Error('User not found');
    }
    return { is_private: Boolean(res.rows[0].is_private) };
};

const updateAccountPrivacy = async (userId, isPrivate) => {
    const res = await pool.query(
        'UPDATE users SET is_private = $1, updated_at = NOW() WHERE id = $2 RETURNING is_private',
        [Boolean(isPrivate), userId]
    );
    if (res.rows.length === 0) {
        throw new Error('User not found');
    }
    return { is_private: Boolean(res.rows[0].is_private) };
};

const getCloseFriends = async (userId) => {
    const friendsRes = await pool.query(
        `SELECT u.id, u.username, u.email, u.avatar_url, u.roll_number
         FROM close_friends cf
         JOIN users u ON cf.friend_id = u.id
         WHERE cf.user_id = $1
         ORDER BY u.username ASC`,
        [userId]
    );

    const availableRes = await pool.query(
        `SELECT u.id, u.username, u.email, u.avatar_url, u.roll_number
         FROM users u
         WHERE u.id != $1
         AND u.id NOT IN (SELECT friend_id FROM close_friends WHERE user_id = $1)
         ORDER BY u.username ASC
         LIMIT 50`,
        [userId]
    );

    return {
        close_friends: friendsRes.rows,
        available_users: availableRes.rows,
    };
};

const addCloseFriend = async (userId, friendId) => {
    if (userId === friendId) {
        throw new Error('Cannot add yourself as close friend');
    }
    await pool.query(
        `INSERT INTO close_friends (user_id, friend_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [userId, friendId]
    );
    return getCloseFriends(userId);
};

const removeCloseFriend = async (userId, friendId) => {
    await pool.query(
        `DELETE FROM close_friends WHERE user_id = $1 AND friend_id = $2`,
        [userId, friendId]
    );
    return getCloseFriends(userId);
};

const getBlockedUsers = async (userId) => {
    const res = await pool.query(
        `SELECT u.id, u.username, u.email, u.avatar_url, u.roll_number, bu.created_at
         FROM blocked_users bu
         JOIN users u ON bu.blocked_user_id = u.id
         WHERE bu.user_id = $1
         ORDER BY bu.created_at DESC`,
        [userId]
    );
    return { blocked_users: res.rows };
};

const blockUser = async (userId, blockedUserId) => {
    if (userId === blockedUserId) {
        throw new Error('Cannot block yourself');
    }
    await pool.query(
        `INSERT INTO blocked_users (user_id, blocked_user_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, blocked_user_id) DO NOTHING`,
        [userId, blockedUserId]
    );
    // Also remove from close_friends if exists
    await pool.query(
        `DELETE FROM close_friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, blockedUserId]
    );
    return getBlockedUsers(userId);
};

const unblockUser = async (userId, blockedUserId) => {
    await pool.query(
        `DELETE FROM blocked_users WHERE user_id = $1 AND blocked_user_id = $2`,
        [userId, blockedUserId]
    );
    return getBlockedUsers(userId);
};

const getStoryLocationSettings = async (userId) => {
    const res = await pool.query(`SELECT settings FROM user_settings WHERE user_id = $1`, [userId]);
    const settings = res.rows[0]?.settings || {};
    const privacy = settings.privacy_controls || {};
    return {
        story_privacy: privacy.story_privacy || 'everyone',
        story_replies: privacy.story_replies || 'everyone',
        story_sharing: privacy.story_sharing || 'allow',
        location_sharing: privacy.location_sharing || 'off',
    };
};

const updateStoryLocationSettings = async (userId, payload) => {
    const currentRes = await pool.query(`SELECT settings FROM user_settings WHERE user_id = $1`, [userId]);
    const settings = currentRes.rows[0]?.settings || {};
    const updatedPrivacy = {
        story_privacy: payload.story_privacy || 'everyone',
        story_replies: payload.story_replies || 'everyone',
        story_sharing: payload.story_sharing || 'allow',
        location_sharing: payload.location_sharing || 'off',
    };

    const newSettings = { ...settings, privacy_controls: updatedPrivacy };

    await pool.query(
        `INSERT INTO user_settings (user_id, settings, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()`,
        [userId, JSON.stringify(newSettings)]
    );

    return updatedPrivacy;
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

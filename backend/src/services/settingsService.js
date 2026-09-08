const { pool } = require('../config/database');

const defaultSettings = {
    notifications: {
        messages: true,
        story_replies: true,
        story_reactions: true,
        likes: true,
        comments: true,
        mentions: true,
        startup_interactions: true,
        study_reminders: true,
        system_notifications: true,
    },
    privacy: {
        profile_visibility: 'public',
        story_visibility: 'everyone',
        message_permission: 'everyone',
        comment_permission: 'everyone',
        mention_permission: 'everyone',
        tag_permission: 'everyone',
    },
    activity: {
        show_online_status: true,
        activity_status: true,
    },
    content: {
        show_like_counts: true,
        show_share_counts: true,
        recommended_posts: true,
    },
    app: {
        archive_stories: true,
        download_media: true,
        text_size: 'medium',
        reduced_motion: false,
        language: 'English',
    },
    academic: {
        college: 'StudyVault University',
        course: 'B.Tech',
        department: 'Computer Science',
        semester: 'Semester 4',
        daily_study_goal: '4 hours',
    },
    close_friends: [],
    blocked_accounts: [],
    restricted_accounts: [],
    muted_accounts: [],
    hidden_words: ['spam', 'scam', 'hate'],
};

const getUserSettings = async (userId) => {
    const res = await pool.query(`SELECT settings FROM user_settings WHERE user_id = $1`, [userId]);
    if (res.rows.length === 0) {
        // Initialize default settings
        await pool.query(
            `INSERT INTO user_settings (user_id, settings) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, JSON.stringify(defaultSettings)]
        );
        return defaultSettings;
    }
    return { ...defaultSettings, ...res.rows[0].settings };
};

const updateUserSettings = async (userId, newSettings) => {
    const current = await getUserSettings(userId);
    const updated = { ...current, ...newSettings };

    const res = await pool.query(
        `INSERT INTO user_settings (user_id, settings, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()
         RETURNING settings`,
        [userId, JSON.stringify(updated)]
    );
    return res.rows[0].settings;
};

module.exports = {
    getUserSettings,
    updateUserSettings,
};

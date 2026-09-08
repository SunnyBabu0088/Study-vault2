const { pool } = require('../config/database');

const getSettings = async (conversationId, userId) => {
    const result = await pool.query(
        `SELECT conversation_id, user_id, theme_id, nickname, muted_until, updated_at
         FROM conversation_settings
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
    );

    if (result.rows.length === 0) {
        return {
            conversation_id: conversationId,
            user_id: userId,
            theme_id: 'minimalist',
            nickname: null,
            muted_until: null,
        };
    }
    return result.rows[0];
};

const updateTheme = async (conversationId, userId, themeId) => {
    const validThemes = ['cyberpunk', 'gradient', 'nature', 'minimalist', 'arctic'];
    const theme = validThemes.includes(themeId) ? themeId : 'minimalist';

    const result = await pool.query(
        `INSERT INTO conversation_settings (conversation_id, user_id, theme_id, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET theme_id = EXCLUDED.theme_id, updated_at = NOW()
         RETURNING *`,
        [conversationId, userId, theme]
    );
    return result.rows[0];
};

const updateNickname = async (conversationId, userId, nickname) => {
    const cleanNickname = nickname ? String(nickname).trim().slice(0, 100) : null;

    const result = await pool.query(
        `INSERT INTO conversation_settings (conversation_id, user_id, nickname, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET nickname = EXCLUDED.nickname, updated_at = NOW()
         RETURNING *`,
        [conversationId, userId, cleanNickname]
    );
    return result.rows[0];
};

const updateMute = async (conversationId, userId, duration) => {
    let mutedUntil = null;
    const now = new Date();

    if (duration === '6h') {
        mutedUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    } else if (duration === '12h') {
        mutedUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    } else if (duration === '1d') {
        mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (duration === '1w') {
        mutedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const result = await pool.query(
        `INSERT INTO conversation_settings (conversation_id, user_id, muted_until, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET muted_until = EXCLUDED.muted_until, updated_at = NOW()
         RETURNING *`,
        [conversationId, userId, mutedUntil]
    );
    return result.rows[0];
};

const clearConversation = async (conversationId, userId) => {
    await pool.query(
        `INSERT INTO cleared_conversations (conversation_id, user_id, cleared_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET cleared_at = NOW()`,
        [conversationId, userId]
    );
    return { success: true, conversation_id: conversationId, user_id: userId };
};

const searchMessages = async (conversationId, query) => {
    if (!query || !query.trim()) return [];
    const searchTerm = `%${query.trim()}%`;
    const result = await pool.query(
        `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at, u.username as sender_username
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1 AND m.content ILIKE $2
         ORDER BY m.created_at ASC`,
        [conversationId, searchTerm]
    );
    return result.rows;
};

module.exports = {
    getSettings,
    updateTheme,
    updateNickname,
    updateMute,
    clearConversation,
    searchMessages,
};

const { pool } = require('../config/database');

const getModerationQueue = async () => {
    const postsRes = await pool.query(
        `SELECT id, user_id, 'post' AS entity_type, title AS content, media_url, moderation_status, moderation_reason, created_at
         FROM startup_posts WHERE moderation_status = 'REVIEW'`
    );

    const reelsRes = await pool.query(
        `SELECT id, user_id, 'reel' AS entity_type, caption AS content, video_url AS media_url, moderation_status, moderation_reason, created_at
         FROM reels WHERE moderation_status = 'REVIEW'`
    );

    const storiesRes = await pool.query(
        `SELECT id, user_id, 'story' AS entity_type, content, media_url, moderation_status, moderation_reason, created_at
         FROM stories WHERE moderation_status = 'REVIEW'`
    );

    const usersRes = await pool.query(
        `SELECT id, id AS user_id, 'profile' AS entity_type, username AS content, avatar_url AS media_url, avatar_moderation_status AS moderation_status, avatar_moderation_reason AS moderation_reason, created_at
         FROM users WHERE avatar_moderation_status = 'REVIEW'`
    );

    return [...postsRes.rows, ...reelsRes.rows, ...storiesRes.rows, ...usersRes.rows].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
};

const decideModeration = async (entityType, entityId, decision, reason = '') => {
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
        throw new Error('Invalid decision. Must be APPROVED or REJECTED.');
    }

    const tableMap = {
        post: 'startup_posts',
        reel: 'reels',
        story: 'stories',
        message: 'messages'
    };

    if (entityType === 'profile') {
        const res = await pool.query(
            `UPDATE users SET avatar_moderation_status = $1, avatar_moderation_reason = $2 WHERE id = $3 RETURNING id, avatar_moderation_status`,
            [decision, reason, entityId]
        );
        return res.rows[0];
    }

    const targetTable = tableMap[entityType.toLowerCase()];
    if (!targetTable) throw new Error('Unsupported entity type for moderation decision.');

    const res = await pool.query(
        `UPDATE ${targetTable} SET moderation_status = $1, moderation_reason = $2, moderated_at = NOW() WHERE id = $3 RETURNING id, moderation_status`,
        [decision, reason, entityId]
    );

    return res.rows[0];
};

module.exports = {
    getModerationQueue,
    decideModeration
};

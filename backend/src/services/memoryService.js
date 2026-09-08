const { pool } = require('../config/database');
const moderationService = require('./moderationService');

const verifyStoryApproved = async (storyId) => {
    const storyRes = await pool.query(
        `SELECT id, content, media_url, media_type, moderation_status FROM stories WHERE id::text = $1 LIMIT 1`,
        [String(storyId)]
    );
    if (storyRes.rows.length === 0) {
        return true;
    }
    const story = storyRes.rows[0];
    if (story.moderation_status === 'REJECTED') {
        throw new Error('Rejected content cannot be added to Memories.');
    }
    if (story.moderation_status === 'PENDING' || !story.moderation_status) {
        const textMod = moderationService.moderateText(story.content);
        if (!textMod.allowed || textMod.status === 'REJECTED') {
            throw new Error('Story content failed moderation and cannot be added to Memories.');
        }
    }
    return true;
};

const getMemoriesForUser = async (userId) => {
    const query = `
        SELECT m.id, m.name, m.created_at, m.updated_at,
               COALESCE(json_agg(
                   json_build_object(
                       'id', ms.id,
                       'story_id', ms.story_id,
                       'position', ms.position,
                       'content', s.content,
                       'media_url', s.media_url,
                       'media_type', s.media_type,
                       'background', s.background
                   ) ORDER BY ms.position ASC
               ) FILTER (WHERE ms.id IS NOT NULL), '[]') AS stories
        FROM memories m
        LEFT JOIN memory_stories ms ON ms.memory_id = m.id
        LEFT JOIN stories s ON s.id::text = ms.story_id
        WHERE m.user_id = $1
        GROUP BY m.id
        ORDER BY m.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const createMemory = async (userId, name, storyIds = []) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertM = await client.query(
            `INSERT INTO memories (user_id, name) VALUES ($1, $2) RETURNING *`,
            [userId, name]
        );
        const memory = insertM.rows[0];

        // Also keep highlights table in sync if it exists
        try {
            await client.query(
                `INSERT INTO highlights (id, user_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                [memory.id, userId, name, memory.created_at, memory.updated_at]
            );
        } catch (_) {}

        if (Array.isArray(storyIds) && storyIds.length > 0) {
            for (let i = 0; i < storyIds.length; i++) {
                await verifyStoryApproved(storyIds[i]);
                await client.query(
                    `INSERT INTO memory_stories (memory_id, story_id, position)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (memory_id, story_id) DO NOTHING`,
                    [memory.id, String(storyIds[i]), i]
                );
                try {
                    await client.query(
                        `INSERT INTO highlight_stories (highlight_id, story_id, position)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (highlight_id, story_id) DO NOTHING`,
                        [memory.id, String(storyIds[i]), i]
                    );
                } catch (_) {}
            }
        }
        await client.query('COMMIT');
        return memory;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateMemory = async (userId, memoryId, name) => {
    const result = await pool.query(
        `UPDATE memories SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
        [name, memoryId, userId]
    );
    try {
        await pool.query(
            `UPDATE highlights SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
            [name, memoryId, userId]
        );
    } catch (_) {}
    return result.rows[0];
};

const deleteMemory = async (userId, memoryId) => {
    const result = await pool.query(
        `DELETE FROM memories WHERE id = $1 AND user_id = $2 RETURNING id`,
        [memoryId, userId]
    );
    try {
        await pool.query(
            `DELETE FROM highlights WHERE id = $1 AND user_id = $2`,
            [memoryId, userId]
        );
    } catch (_) {}
    return result.rows[0];
};

const addStoryToMemory = async (userId, memoryId, storyId) => {
    const check = await pool.query(`SELECT id FROM memories WHERE id = $1 AND user_id = $2`, [memoryId, userId]);
    if (check.rows.length === 0) return null;

    await verifyStoryApproved(storyId);

    const maxPosRes = await pool.query(`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM memory_stories WHERE memory_id = $1`, [memoryId]);
    const nextPos = maxPosRes.rows[0].next_pos;

    const res = await pool.query(
        `INSERT INTO memory_stories (memory_id, story_id, position) VALUES ($1, $2, $3)
         ON CONFLICT (memory_id, story_id) DO NOTHING RETURNING *`,
        [memoryId, String(storyId), nextPos]
    );
    try {
        await pool.query(
            `INSERT INTO highlight_stories (highlight_id, story_id, position) VALUES ($1, $2, $3)
             ON CONFLICT (highlight_id, story_id) DO NOTHING`,
            [memoryId, String(storyId), nextPos]
        );
    } catch (_) {}
    return res.rows[0];
};

const removeStoryFromMemory = async (userId, memoryId, storyId) => {
    const check = await pool.query(`SELECT id FROM memories WHERE id = $1 AND user_id = $2`, [memoryId, userId]);
    if (check.rows.length === 0) return null;

    const res = await pool.query(
        `DELETE FROM memory_stories WHERE memory_id = $1 AND story_id = $2 RETURNING *`,
        [memoryId, String(storyId)]
    );
    try {
        await pool.query(
            `DELETE FROM highlight_stories WHERE highlight_id = $1 AND story_id = $2`,
            [memoryId, String(storyId)]
        );
    } catch (_) {}
    return res.rows[0];
};

module.exports = {
    getMemoriesForUser,
    createMemory,
    updateMemory,
    deleteMemory,
    addStoryToMemory,
    removeStoryFromMemory,
};

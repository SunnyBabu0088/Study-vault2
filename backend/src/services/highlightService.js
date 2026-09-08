const { pool } = require('../config/database');
const moderationService = require('./moderationService');

const verifyStoryApproved = async (storyId) => {
    // Check if storyId is a valid UUID or text ID
    const storyRes = await pool.query(
        `SELECT id, content, media_url, media_type, moderation_status FROM stories WHERE id::text = $1 LIMIT 1`,
        [String(storyId)]
    );
    if (storyRes.rows.length === 0) {
        // If story record is missing or dynamic, allow if not explicitly rejected
        return true;
    }
    const story = storyRes.rows[0];
    if (story.moderation_status === 'REJECTED') {
        throw new Error('Rejected content cannot be added to Highlights.');
    }
    if (story.moderation_status === 'PENDING' || !story.moderation_status) {
        // Re-check moderation
        const textMod = moderationService.moderateText(story.content);
        if (!textMod.allowed || textMod.status === 'REJECTED') {
            throw new Error('Story content failed moderation and cannot be added to Highlights.');
        }
    }
    return true;
};

const getHighlightsForUser = async (userId) => {
    const query = `
        SELECT h.id, h.name, h.created_at, h.updated_at,
               COALESCE(json_agg(
                   json_build_object(
                       'id', hs.id,
                       'story_id', hs.story_id,
                       'position', hs.position
                   ) ORDER BY hs.position ASC
               ) FILTER (WHERE hs.id IS NOT NULL), '[]') AS stories
        FROM highlights h
        LEFT JOIN highlight_stories hs ON hs.highlight_id = h.id
        WHERE h.user_id = $1
        GROUP BY h.id
        ORDER BY h.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const createHighlight = async (userId, name, storyIds = []) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertH = await client.query(
            `INSERT INTO highlights (user_id, name) VALUES ($1, $2) RETURNING *`,
            [userId, name]
        );
        const highlight = insertH.rows[0];

        if (Array.isArray(storyIds) && storyIds.length > 0) {
            for (let i = 0; i < storyIds.length; i++) {
                await verifyStoryApproved(storyIds[i]);
                await client.query(
                    `INSERT INTO highlight_stories (highlight_id, story_id, position)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (highlight_id, story_id) DO NOTHING`,
                    [highlight.id, String(storyIds[i]), i]
                );
            }
        }
        await client.query('COMMIT');
        return highlight;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateHighlight = async (userId, highlightId, name) => {
    const result = await pool.query(
        `UPDATE highlights SET name = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
        [name, highlightId, userId]
    );
    return result.rows[0];
};

const deleteHighlight = async (userId, highlightId) => {
    const result = await pool.query(
        `DELETE FROM highlights WHERE id = $1 AND user_id = $3 RETURNING id`,
        [highlightId, userId]
    );
    return result.rows[0];
};

const addStoryToHighlight = async (userId, highlightId, storyId) => {
    const check = await pool.query(`SELECT id FROM highlights WHERE id = $1 AND user_id = $2`, [highlightId, userId]);
    if (check.rows.length === 0) return null;

    await verifyStoryApproved(storyId);

    const maxPosRes = await pool.query(`SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM highlight_stories WHERE highlight_id = $1`, [highlightId]);
    const nextPos = maxPosRes.rows[0].next_pos;

    const res = await pool.query(
        `INSERT INTO highlight_stories (highlight_id, story_id, position) VALUES ($1, $2, $3)
         ON CONFLICT (highlight_id, story_id) DO NOTHING RETURNING *`,
        [highlightId, String(storyId), nextPos]
    );
    return res.rows[0];
};

const removeStoryFromHighlight = async (userId, highlightId, storyId) => {
    const check = await pool.query(`SELECT id FROM highlights WHERE id = $1 AND user_id = $2`, [highlightId, userId]);
    if (check.rows.length === 0) return null;

    const res = await pool.query(
        `DELETE FROM highlight_stories WHERE highlight_id = $1 AND story_id = $2 RETURNING *`,
        [highlightId, String(storyId)]
    );
    return res.rows[0];
};

module.exports = {
    getHighlightsForUser,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    addStoryToHighlight,
    removeStoryFromHighlight,
};

const { pool } = require('../config/database');

const likePost = async (userId, postId) => {
    const existing = await pool.query(
        `SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
        [postId, userId]
    );
    if (existing.rows[0]) {
        return { liked: true };
    }

    await pool.query(
        `INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)`,
        [postId, userId]
    );

    return { liked: true };
};

const unlikePost = async (userId, postId) => {
    await pool.query(`DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    return { liked: false };
};

const savePost = async (userId, postId) => {
    const existing = await pool.query(
        `SELECT id FROM post_saves WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
        [postId, userId]
    );
    if (existing.rows[0]) {
        return { saved: true };
    }

    await pool.query(
        `INSERT INTO post_saves (post_id, user_id) VALUES ($1, $2)`,
        [postId, userId]
    );

    return { saved: true };
};

const unsavePost = async (userId, postId) => {
    await pool.query(`DELETE FROM post_saves WHERE post_id = $1 AND user_id = $2`, [postId, userId]);
    return { saved: false };
};

const addSuggestion = async (userId, postId, content) => {
    const result = await pool.query(
        `INSERT INTO post_suggestions (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, post_id, user_id, content, created_at`,
        [postId, userId, content]
    );
    return result.rows[0];
};

const getSuggestions = async (userId, postId) => {
    // Verify the post exists and user has access (owner or public)
    const postResult = await pool.query(
        `SELECT id, user_id, visibility FROM startup_posts WHERE id = $1 LIMIT 1`,
        [postId]
    );
    const post = postResult.rows[0];
    if (!post || (post.user_id !== userId && post.visibility !== 'public')) {
        return [];
    }

    const result = await pool.query(
        `SELECT id, post_id, user_id, content, created_at FROM post_suggestions WHERE post_id = $1 ORDER BY created_at DESC`,
        [postId]
    );
    return result.rows;
};

module.exports = { likePost, unlikePost, savePost, unsavePost, addSuggestion, getSuggestions };

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');
const moderationService = require('./moderationService');

const formatPostRow = (row) => ({
    ...row,
    like_count: Number(row.like_count || 0),
    save_count: Number(row.save_count || 0),
    likes: Number(row.like_count || 0),
    saves: Number(row.save_count || 0),
});

const getPostsForUser = async (userId, limit = 50, offset = 0) => {
    const result = await pool.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.hashtags, p.visibility, p.scheduled_date, p.media_url, p.media_type, p.category, p.moderation_status, p.created_at, p.updated_at,
                u.username AS author_username, u.avatar_url AS author_avatar,
                (SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
                (SELECT COUNT(*)::int FROM post_saves ps WHERE ps.post_id = p.id) AS save_count,
                EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked,
                EXISTS (SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = $1) AS saved
         FROM startup_posts p
         JOIN users u ON u.id = p.user_id
         WHERE (
           p.user_id = $1 
           OR (p.visibility = 'public' AND p.moderation_status = 'APPROVED')
           OR (p.visibility IN ('private', 'close_friends', 'close_friends_only') AND p.moderation_status = 'APPROVED' AND (
               EXISTS (SELECT 1 FROM friends f WHERE (f.user_id = p.user_id AND f.friend_id = $1) OR (f.friend_id = p.user_id AND f.user_id = $1))
               OR EXISTS (SELECT 1 FROM close_friends cf WHERE (cf.user_id = p.user_id AND cf.friend_id = $1) OR (cf.friend_id = p.user_id AND cf.user_id = $1))
           ))
         )
           AND p.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $1)
           AND p.user_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $1)
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows.map(formatPostRow);
};

const getPostById = async (userId, id) => {
    const result = await pool.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.hashtags, p.visibility, p.scheduled_date, p.media_url, p.media_type, p.category, p.moderation_status, p.created_at, p.updated_at,
                u.username AS author_username, u.avatar_url AS author_avatar,
                (SELECT COUNT(*)::int FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
                (SELECT COUNT(*)::int FROM post_saves ps WHERE ps.post_id = p.id) AS save_count,
                EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked,
                EXISTS (SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = $1) AS saved
         FROM startup_posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.id = $2 
           AND (
             p.user_id = $1 
             OR (p.visibility = 'public' AND p.moderation_status = 'APPROVED')
             OR (p.visibility IN ('private', 'close_friends', 'close_friends_only') AND p.moderation_status = 'APPROVED' AND (
                 EXISTS (SELECT 1 FROM friends f WHERE (f.user_id = p.user_id AND f.friend_id = $1) OR (f.friend_id = p.user_id AND f.user_id = $1))
                 OR EXISTS (SELECT 1 FROM close_friends cf WHERE (cf.user_id = p.user_id AND cf.friend_id = $1) OR (cf.friend_id = p.user_id AND cf.user_id = $1))
             ))
           )
           AND p.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $1)
           AND p.user_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $1)
         LIMIT 1`,
        [userId, id]
    );
    return result.rows[0] ? formatPostRow(result.rows[0]) : null;
};

const createPost = async ({ userId, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category }) => {
    // Normalize visibility to public or private
    const normalizedVisibility = (visibility && visibility.toLowerCase() === 'private') ? 'private' : 'public';

    // 1. User restriction check
    const restriction = await moderationService.checkUserRestriction(userId);
    if (restriction.restricted) throw new Error(restriction.reason);

    // 2. Moderate text
    const fullText = `${title || ''} ${content || ''} ${hashtags || ''}`;
    const textMod = moderationService.moderateText(fullText, category);
    if (!textMod.allowed || textMod.status === 'REJECTED') {
        await moderationService.recordUserViolation(userId, textMod.reason, textMod.isMinorProtection);
        throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
    }

    // 3. Moderate media URL if provided
    let mediaModStatus = textMod.status;
    let mediaModReason = textMod.reason;

    if (media_url) {
        let filePath = '';
        try {
            const parsedUrl = new URL(media_url, 'http://localhost:5000');
            const filename = path.basename(parsedUrl.pathname);
            filePath = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads', 'public', filename);
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads', filename);
            }
        } catch (e) {
            filePath = media_url;
        }

        const mediaMod = media_type && media_type.startsWith('video')
            ? await moderationService.moderateVideo(filePath)
            : await moderationService.moderateImage(filePath);

        if (!mediaMod.allowed || mediaMod.status === 'REJECTED') {
            await moderationService.recordUserViolation(userId, mediaMod.reason, mediaMod.isMinorProtection);
            throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
        }
        if (mediaMod.status === 'REVIEW') {
            mediaModStatus = 'REVIEW';
            mediaModReason = mediaMod.reason;
        }
    }

    const result = await pool.query(
        `INSERT INTO startup_posts (user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category, moderation_status, moderation_reason, moderated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id, user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category, moderation_status, created_at, updated_at`,
        [userId, title, content, hashtags || null, normalizedVisibility, scheduled_date || null, media_url || null, media_type || null, category || 'startup', mediaModStatus, mediaModReason || null]
    );
    return result.rows[0];
};

const updatePost = async (userId, id, fields) => {
    const updates = [];
    const values = [userId, id];
    let idx = 3;

    if (fields.content || fields.title) {
        const textMod = moderationService.moderateText(`${fields.title || ''} ${fields.content || ''}`);
        if (!textMod.allowed || textMod.status === 'REJECTED') {
            throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
        }
    }

    Object.entries(fields).forEach(([key, value]) => {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx += 1;
    });

    if (updates.length === 0) {
        return getPostById(userId, id);
    }

    const result = await pool.query(
        `UPDATE startup_posts SET ${updates.join(', ')}, updated_at = NOW()
         WHERE user_id = $1 AND id = $2
         RETURNING id, user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category, moderation_status, created_at, updated_at`,
        values
    );
    return result.rows[0] || null;
};

const deletePost = async (userId, id) => {
    const postResult = await pool.query(
        `SELECT media_url FROM startup_posts WHERE user_id = $1 AND id = $2 LIMIT 1`,
        [userId, id]
    );
    const post = postResult.rows[0];
    const result = await pool.query(`DELETE FROM startup_posts WHERE user_id = $1 AND id = $2`, [userId, id]);

    if (post && post.media_url) {
        try {
            const url = new URL(post.media_url, 'http://localhost:5000');
            const filename = path.basename(url.pathname);
            const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads', 'public', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Failed to delete media file:', error.message);
        }
    }
    return result.rowCount > 0;
};

const addPostComment = async (postId, userId, content) => {
    const textMod = moderationService.moderateText(content);
    if (!textMod.allowed || textMod.status === 'REJECTED') {
        throw new Error("Comment blocked: This content doesn't meet StudyVault's community guidelines.");
    }

    const result = await pool.query(
        `INSERT INTO post_comments (post_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [postId, userId, content]
    );
    const comment = result.rows[0];
    const userResult = await pool.query(`SELECT username, avatar_url FROM users WHERE id = $1`, [userId]);
    return {
        ...comment,
        username: userResult.rows[0]?.username || 'Student',
        avatar_url: userResult.rows[0]?.avatar_url || null,
    };
};

const getPostComments = async (postId) => {
    const result = await pool.query(
        `SELECT pc.*, u.username, u.avatar_url
         FROM post_comments pc
         JOIN users u ON pc.user_id = u.id
         WHERE pc.post_id = $1
         ORDER BY pc.created_at ASC`,
        [postId]
    );
    return result.rows;
};

const recordPostShare = async (postId, userId) => {
    await pool.query(
        `INSERT INTO post_shares (post_id, user_id) VALUES ($1, $2)`,
        [postId, userId]
    );
    return { shared: true };
};

module.exports = { getPostsForUser, getPostById, createPost, updatePost, deletePost, addPostComment, getPostComments, recordPostShare };

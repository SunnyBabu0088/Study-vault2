const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');

const getPostsForUser = async (userId, limit, offset) => {
    const result = await pool.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.hashtags, p.visibility, p.scheduled_date, p.media_url, p.media_type, p.category, p.created_at, p.updated_at,
                u.username AS author_username,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM post_saves ps WHERE ps.post_id = p.id) AS save_count,
                EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked,
                EXISTS (SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = $1) AS saved
         FROM startup_posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1 OR p.visibility = 'public'
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

const getPostById = async (userId, id) => {
    const result = await pool.query(
        `SELECT p.id, p.user_id, p.title, p.content, p.hashtags, p.visibility, p.scheduled_date, p.media_url, p.media_type, p.category, p.created_at, p.updated_at,
                u.username AS author_username,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
                (SELECT COUNT(*) FROM post_saves ps WHERE ps.post_id = p.id) AS save_count,
                EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $1) AS liked,
                EXISTS (SELECT 1 FROM post_saves ps WHERE ps.post_id = p.id AND ps.user_id = $1) AS saved
         FROM startup_posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.id = $2 AND (p.user_id = $1 OR p.visibility = 'public')
         LIMIT 1`,
        [userId, id]
    );
    return result.rows[0] || null;
};

const createPost = async ({ userId, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category }) => {
    const result = await pool.query(
        `INSERT INTO startup_posts (user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category, created_at, updated_at`,
        [userId, title, content, hashtags || null, visibility || 'public', scheduled_date || null, media_url || null, media_type || null, category || 'startup']
    );
    return result.rows[0];
};

const updatePost = async (userId, id, fields) => {
    const updates = [];
    const values = [userId, id];
    let idx = 3;

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
         RETURNING id, user_id, title, content, hashtags, visibility, scheduled_date, media_url, media_type, category, created_at, updated_at`,
        values
    );
    return result.rows[0] || null;
};

const deletePost = async (userId, id) => {
    // Get post info first to clean up media
    const postResult = await pool.query(
        `SELECT media_url FROM startup_posts WHERE user_id = $1 AND id = $2 LIMIT 1`,
        [userId, id]
    );
    
    const post = postResult.rows[0];
    
    // Delete the post
    const result = await pool.query(`DELETE FROM startup_posts WHERE user_id = $1 AND id = $2`, [userId, id]);
    
    // Clean up associated media file if exists
    if (post && post.media_url) {
        try {
            // Extract filename from URL
            const url = new URL(post.media_url);
            const filename = path.basename(url.pathname);
            const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, filename);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            // Log but don't fail the deletion if file cleanup fails
            console.error('Failed to delete media file:', error.message);
        }
    }
    
    return result.rowCount > 0;
};

module.exports = { getPostsForUser, getPostById, createPost, updatePost, deletePost };

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const env = require('../config/env');
const moderationService = require('./moderationService');

const storeBase64Upload = async (userId, filename, mimeType, content) => {
    // 1. Check user restriction
    const restriction = await moderationService.checkUserRestriction(userId);
    if (restriction.restricted) {
        throw new Error(restriction.reason);
    }

    const extension = path.extname(filename) || (mimeType && mimeType.includes('png') ? '.png' : '.jpg');
    const buffer = Buffer.from(content, 'base64');

    // 2. Save into temporary quarantine
    const { tempPath } = moderationService.quarantineSaveFile(buffer, extension);

    // 3. Moderate content
    let moderationResult;
    if (mimeType && mimeType.startsWith('video/')) {
        moderationResult = await moderationService.moderateVideo(tempPath);
    } else {
        moderationResult = await moderationService.moderateImage(tempPath, filename);
    }

    // 4. Handle rejection
    if (!moderationResult.allowed || moderationResult.status === 'REJECTED') {
        moderationService.deleteQuarantineFile(tempPath);
        await moderationService.recordUserViolation(userId, moderationResult.reason, moderationResult.isMinorProtection);
        throw new Error("Upload blocked: This content doesn't meet StudyVault's community guidelines.");
    }

    // 5. Publish approved or review media
    const storedName = `${randomUUID()}${extension}`;
    moderationService.publishFromQuarantine(tempPath, storedName);

    const objectKey = storedName;
    const result = await pool.query(
        `INSERT INTO uploads (user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, moderation_status, moderation_reason, moderated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, moderation_status, created_at`,
        [userId, filename, storedName, mimeType, buffer.length, 'local', objectKey, moderationResult.status, moderationResult.reason || null]
    );

    return result.rows[0];
};

const getUploadById = async (userId, id) => {
    const result = await pool.query(
        `SELECT id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, moderation_status, created_at FROM uploads WHERE id = $1 AND (user_id = $2 OR moderation_status = 'APPROVED') LIMIT 1`,
        [id, userId]
    );
    return result.rows[0] || null;
};

const deleteUpload = async (userId, id) => {
    const result = await pool.query(`DELETE FROM uploads WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rowCount > 0;
};

module.exports = { storeBase64Upload, getUploadById, deleteUpload };

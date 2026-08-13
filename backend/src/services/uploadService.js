const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { pool } = require('../config/database');
const env = require('../config/env');

const ensureUploadDir = () => {
    const targetDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    fs.mkdirSync(targetDir, { recursive: true });
    return targetDir;
};

const storeBase64Upload = async (userId, filename, mimeType, content) => {
    const uploadDir = ensureUploadDir();
    const extension = path.extname(filename) || '.bin';
    const storedName = `${randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, storedName);

    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(filePath, buffer);

    const objectKey = storedName;
    const result = await pool.query(
        `INSERT INTO uploads (user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, created_at`,
        [userId, filename, storedName, mimeType, buffer.length, 'local', objectKey]
    );

    return result.rows[0];
};

const getUploadById = async (userId, id) => {
    const result = await pool.query(
        `SELECT id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, created_at FROM uploads WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [id, userId]
    );
    return result.rows[0] || null;
};

const deleteUpload = async (userId, id) => {
    const result = await pool.query(`DELETE FROM uploads WHERE id = $1 AND user_id = $2`, [id, userId]);
    return result.rowCount > 0;
};

module.exports = { storeBase64Upload, getUploadById, deleteUpload };

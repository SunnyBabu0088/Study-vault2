const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const env = require('../config/env');
const { validateUpload } = require('../middleware/upload');
const { sendCreated, sendSuccess } = require('../utils/response');

const uploadFile = async (req, res, next) => {
    try {
        // validateUpload middleware already ran and ensured req.file exists
        const file = req.file;
        
        // Build the public URL for the uploaded file
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;

        // Store metadata in database
        const result = await pool.query(
            `INSERT INTO uploads (user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, created_at`,
            [
                req.user.id,
                file.originalname,
                file.filename,
                file.mimetype,
                file.size,
                'local',
                file.filename
            ]
        );

        const upload = result.rows[0];
        
        return sendCreated(res, {
            upload: {
                ...upload,
                url: fileUrl
            }
        });
    } catch (error) {
        // Clean up uploaded file if database insert fails
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

const getUpload = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT id, user_id, original_name, stored_name, mime_type, size_bytes, bucket, object_key, created_at 
             FROM uploads 
             WHERE id = $1 AND user_id = $2 
             LIMIT 1`,
            [id, req.user.id]
        );
        
        const upload = result.rows[0];
        if (!upload) {
            const error = new Error('Upload not found');
            error.statusCode = 404;
            throw error;
        }

        // Build the public URL
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${upload.stored_name}`;

        return sendSuccess(res, { 
            upload: {
                ...upload,
                url: fileUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

const deleteUpload = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get upload info first
        const result = await pool.query(
            `SELECT stored_name FROM uploads WHERE id = $1 AND user_id = $2 LIMIT 1`,
            [id, req.user.id]
        );
        
        const upload = result.rows[0];
        if (!upload) {
            const error = new Error('Upload not found');
            error.statusCode = 404;
            throw error;
        }

        // Delete file from filesystem
        const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, upload.stored_name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await pool.query(`DELETE FROM uploads WHERE id = $1 AND user_id = $2`, [id, req.user.id]);

        return sendSuccess(res, { message: 'Upload deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadFile, getUpload, deleteUpload, validateUpload };
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = env.UPLOAD_MAX_SIZE_MB * 1024 * 1024; // Convert MB to bytes

const generateSecureFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase();
    const randomName = crypto.randomUUID();
    return `${randomName}${ext}`;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
        // Ensure directory exists
        const fs = require('fs');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const secureName = generateSecureFilename(file.originalname);
        cb(null, secureName);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        const error = new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`);
        error.statusCode = 400;
        return cb(error, false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: fileFilter,
});

const validateUpload = (req, res, next) => {
    if (!req.file) {
        const error = new Error('No file uploaded');
        error.statusCode = 400;
        return next(error);
    }

    // Additional validation
    const file = req.file;
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        // Delete the uploaded file
        const fs = require('fs');
        fs.unlinkSync(file.path);
        
        const error = new Error(`Invalid file type: ${file.mimetype}`);
        error.statusCode = 400;
        return next(error);
    }

    if (file.size > MAX_FILE_SIZE) {
        // Delete the uploaded file
        const fs = require('fs');
        fs.unlinkSync(file.path);
        
        const error = new Error(`File too large. Maximum size is ${env.UPLOAD_MAX_SIZE_MB}MB`);
        error.statusCode = 400;
        return next(error);
    }

    next();
};

module.exports = {
    upload,
    validateUpload,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_MIME_TYPES,
};
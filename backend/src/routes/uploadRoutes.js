const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadFile, getUpload, deleteUpload, validateUpload } = require('../controllers/uploadController');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.post('/', uploadLimiter, upload.single('file'), validateUpload, uploadFile);
router.get('/:id', getUpload);
router.delete('/:id', deleteUpload);

module.exports = router;

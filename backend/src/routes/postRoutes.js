const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { listPosts, getPost, createPost, updatePost, deletePost, addComment, getComments, recordShare } = require('../controllers/postController');

const { postLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth);
router.get('/', listPosts);
router.get('/:id', getPost);
router.post('/', postLimiter, createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.post('/:id/share', recordShare);

module.exports = router;

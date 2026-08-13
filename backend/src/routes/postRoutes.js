const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { listPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listPosts);
router.get('/:id', getPost);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

module.exports = router;

const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { likePost, unlikePost, savePost, unsavePost, addSuggestion, getSuggestions } = require('../controllers/interactionController');

const router = express.Router();

router.use(requireAuth);
router.post('/posts/:id/like', likePost);
router.delete('/posts/:id/like', unlikePost);
router.post('/posts/:id/save', savePost);
router.delete('/posts/:id/save', unsavePost);
router.post('/posts/:id/suggestions', addSuggestion);
router.get('/posts/:id/suggestions', getSuggestions);

module.exports = router;

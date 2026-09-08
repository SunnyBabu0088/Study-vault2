const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', storyController.getStories);
router.get('/activity', requireAuth, storyController.getActivity);
router.post('/', requireAuth, storyController.createStory);
router.delete('/:id', requireAuth, storyController.deleteStory);
router.post('/:id/react', requireAuth, storyController.reactToStory);
router.post('/:id/reply', requireAuth, storyController.replyToStory);
router.post('/:id/view', requireAuth, storyController.viewStory);

module.exports = router;

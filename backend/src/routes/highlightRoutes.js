const express = require('express');
const router = express.Router();
const highlightController = require('../controllers/highlightController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', highlightController.listHighlights);
router.post('/', highlightController.createHighlight);
router.put('/:id', highlightController.updateHighlight);
router.delete('/:id', highlightController.deleteHighlight);
router.post('/:id/stories', highlightController.addStory);
router.delete('/:id/stories/:storyId', highlightController.removeStory);

module.exports = router;

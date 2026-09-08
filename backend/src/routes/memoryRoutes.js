const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', memoryController.listMemories);
router.post('/', memoryController.createMemory);
router.put('/:id', memoryController.updateMemory);
router.delete('/:id', memoryController.deleteMemory);
router.post('/:id/stories', memoryController.addStory);
router.delete('/:id/stories/:storyId', memoryController.removeStory);

module.exports = router;

const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', reelController.getAllReels);
router.get('/feed', reelController.getPersonalizedFeed);
router.post('/', requireAuth, reelController.createReel);
router.get('/:id', reelController.getReelById);
router.delete('/:id', requireAuth, reelController.deleteReel);

router.post('/:id/like', requireAuth, reelController.toggleLike);
router.post('/:id/save', requireAuth, reelController.toggleSave);
router.post('/:id/share', requireAuth, reelController.recordShare);
router.post('/:id/view', requireAuth, reelController.recordView);
router.post('/:id/watch', requireAuth, reelController.recordWatchTime);

router.get('/:id/comments', reelController.getComments);
router.post('/:id/comments', requireAuth, reelController.addComment);

module.exports = router;

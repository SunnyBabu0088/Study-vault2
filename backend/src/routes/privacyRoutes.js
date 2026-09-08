const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/account', privacyController.getAccountPrivacy);
router.put('/account', privacyController.updateAccountPrivacy);

router.get('/close-friends', privacyController.getCloseFriends);
router.post('/close-friends', privacyController.addCloseFriend);
router.delete('/close-friends/:friendId', privacyController.removeCloseFriend);

router.get('/blocked', privacyController.getBlockedUsers);
router.post('/blocked', privacyController.blockUser);
router.delete('/blocked/:blockedUserId', privacyController.unblockUser);

router.get('/story-location', privacyController.getStoryLocationSettings);
router.put('/story-location', privacyController.updateStoryLocationSettings);

module.exports = router;

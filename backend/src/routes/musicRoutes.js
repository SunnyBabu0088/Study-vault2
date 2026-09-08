const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const musicController = require('../controllers/musicController');

const router = express.Router();

router.use(requireAuth);

router.get('/search', musicController.search);
router.get('/categories', musicController.getCategories);
router.get('/trending', musicController.getTrending);
router.get('/favorites', musicController.getFavorites);
router.post('/favorites', musicController.toggleFavorite);
router.get('/recent', musicController.getRecent);

// Admin configuration
router.get('/admin/settings', musicController.getAdminSettings);
router.put('/admin/settings/:provider', musicController.updateAdminSettings);

module.exports = router;

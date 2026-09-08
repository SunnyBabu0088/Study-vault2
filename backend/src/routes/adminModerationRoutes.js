const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const adminModerationService = require('../services/adminModerationService');

router.get('/queue', requireAuth, async (req, res, next) => {
    try {
        const queue = await adminModerationService.getModerationQueue();
        res.json(queue);
    } catch (err) {
        next(err);
    }
});

router.post('/decide', requireAuth, async (req, res, next) => {
    try {
        const { entity_type, entity_id, decision, reason } = req.body;
        const result = await adminModerationService.decideModeration(entity_type, entity_id, decision, reason);
        res.json({ message: `Entity ${decision.toLowerCase()} successfully.`, result });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const reportService = require('../services/reportService');

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { entity_type, entity_id, reason, description } = req.body;
        const report = await reportService.createReport(req.user.id, {
            entity_type,
            entity_id,
            reason,
            description
        });
        res.status(201).json({
            message: 'Report submitted successfully. Thank you for helping keep StudyVault safe.',
            report
        });
    } catch (err) {
        next(err);
    }
});

router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { status, limit, offset } = req.query;
        const reports = await reportService.getReports(status, Number(limit || 50), Number(offset || 0));
        res.json(reports);
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
    try {
        const { status } = req.body;
        const updated = await reportService.updateReportStatus(req.params.id, status);
        if (!updated) return res.status(404).json({ error: 'Report not found' });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

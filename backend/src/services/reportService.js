const { pool } = require('../config/database');

const VALID_REASONS = [
    'nudity_sexual',
    'harassment',
    'hate_speech',
    'impersonation',
    'spam',
    'minor_sexual_content',
    'other'
];

const createReport = async (reporterId, { entity_type, entity_id, reason, description }) => {
    if (!entity_type || !entity_id || !reason) {
        throw new Error('Entity type, entity ID, and report reason are required.');
    }

    if (!VALID_REASONS.includes(reason)) {
        throw new Error(`Invalid report reason. Valid options: ${VALID_REASONS.join(', ')}`);
    }

    const res = await pool.query(
        `INSERT INTO reports (reporter_id, entity_type, entity_id, reason, description, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [reporterId, entity_type, entity_id, reason, description || '']
    );
    const report = res.rows[0];

    // If reported for severe sexual content or minor protection, mark entity for admin review
    if (reason === 'minor_sexual_content' || reason === 'nudity_sexual') {
        const tableMap = {
            post: 'startup_posts',
            reel: 'reels',
            story: 'stories',
            profile: 'users',
            message: 'messages'
        };
        const targetTable = tableMap[entity_type.toLowerCase()];
        if (targetTable) {
            try {
                await pool.query(
                    `UPDATE ${targetTable} SET moderation_status = 'REVIEW', moderation_reason = $1 WHERE id = $2`,
                    [`User Reported (${reason}): ${description || 'Pending review'}`, entity_id]
                );
            } catch (err) {
                console.error('[ReportService] Failed to mark entity for review:', err.message);
            }
        }
    }

    return report;
};

const getReports = async (status = 'pending', limit = 50, offset = 0) => {
    const res = await pool.query(
        `SELECT r.*, u.username as reporter_username
         FROM reports r
         JOIN users u ON u.id = r.reporter_id
         WHERE ($1::text IS NULL OR r.status = $1)
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
    );
    return res.rows;
};

const updateReportStatus = async (reportId, status) => {
    const res = await pool.query(
        `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, reportId]
    );
    return res.rows[0] || null;
};

module.exports = {
    createReport,
    getReports,
    updateReportStatus
};

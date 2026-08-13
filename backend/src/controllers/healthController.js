const { pool } = require('../config/database');

const getHealth = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT 1 AS status');
        res.json({
            status: 'ok',
            database: result.rows[0].status === 1 ? 'connected' : 'unknown',
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        res.status(200).json({
            status: 'ok',
            database: 'unavailable',
            environment: process.env.NODE_ENV || 'development',
            note: 'Database connection is currently unavailable; the API is running in degraded mode.',
        });
    }
};

module.exports = { getHealth };

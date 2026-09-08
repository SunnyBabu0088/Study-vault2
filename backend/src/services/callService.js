const { pool } = require('../config/database');

const createCallSession = async (conversationId, callerId, receiverId, callType = 'audio') => {
    const result = await pool.query(
        `INSERT INTO call_sessions (conversation_id, caller_id, receiver_id, call_type, status, created_at)
         VALUES ($1, $2, $3, $4, 'initiated', NOW())
         RETURNING *`,
        [conversationId, callerId, receiverId || null, callType]
    );
    return result.rows[0];
};

const updateCallSession = async (callId, status, durationSeconds = 0) => {
    const isEnding = ['ended', 'rejected', 'missed'].includes(status);
    const result = await pool.query(
        `UPDATE call_sessions
         SET status = $2,
             duration_seconds = COALESCE($3, duration_seconds),
             ended_at = CASE WHEN $4::boolean THEN NOW() ELSE ended_at END,
             started_at = CASE WHEN $2 = 'ongoing' AND started_at IS NULL THEN NOW() ELSE started_at END
         WHERE id = $1
         RETURNING *`,
        [callId, status, durationSeconds, isEnding]
    );
    return result.rows[0] || null;
};

module.exports = {
    createCallSession,
    updateCallSession,
};

const { pool } = require('../config/database');
const streakService = require('./streakService');

const getMessagesForConversation = async (userId, conversationId) => {
    // First verify the user is a member of this conversation
    const memberCheck = await pool.query(
        `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
        [conversationId, userId]
    );
    
    if (!memberCheck.rows[0]) {
        throw new Error('Not a member of this conversation');
    }

    const result = await pool.query(
        `SELECT m.id,
                m.conversation_id,
                m.sender_id,
                u.username AS sender_username,
                u.avatar_url AS sender_avatar_url,
                m.content,
                m.created_at,
                m.read_at
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC`,
        [conversationId]
    );
    return result.rows;
};

const createMessage = async (senderId, conversationId, content) => {
    const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, conversation_id, sender_id, content, created_at, read_at`,
        [conversationId, senderId, content]
    );
    return result.rows[0];
};

const markMessageRead = async (userId, messageId) => {
    const result = await pool.query(
        `UPDATE messages m
         SET read_at = NOW()
         FROM conversation_members cm
         WHERE m.id = $1
           AND cm.conversation_id = m.conversation_id
           AND cm.user_id = $2
         RETURNING m.id, m.conversation_id, m.sender_id, m.content, m.created_at, m.read_at`,
        [messageId, userId]
    );
    return result.rows[0] || null;
};

const createAndPersistMessage = async (senderId, conversationId, content) => {
    const message = await createMessage(senderId, conversationId, content);
    await streakService.updateStreak(senderId, new Date().toISOString().slice(0, 10));
    return message;
};

module.exports = { getMessagesForConversation, createMessage, markMessageRead, createAndPersistMessage };
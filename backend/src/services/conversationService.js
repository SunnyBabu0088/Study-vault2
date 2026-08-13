const { pool } = require('../config/database');
const userService = require('./userService');

const getConversationsForUser = async (userId) => {
    const result = await pool.query(
        `SELECT c.id,
                c.created_at,
                c.updated_at,
                COALESCE(json_agg(json_build_object('id', u.id, 'username', u.username, 'avatar_url', u.avatar_url) ORDER BY u.username) FILTER (WHERE u.id IS NOT NULL), '[]') AS participants,
                lm.content AS last_message,
                lm.created_at AS last_message_at
         FROM conversations c
         JOIN conversation_members cm ON cm.conversation_id = c.id
         JOIN users u ON u.id = cm.user_id
         LEFT JOIN LATERAL (
           SELECT content, created_at
           FROM messages
           WHERE conversation_id = c.id
           ORDER BY created_at DESC
           LIMIT 1
         ) lm ON true
         WHERE c.id IN (
           SELECT conversation_id FROM conversation_members WHERE user_id = $1
         )
         GROUP BY c.id, lm.content, lm.created_at
         ORDER BY COALESCE(lm.created_at, c.updated_at) DESC`,
        [userId]
    );
    return result.rows;
};

const getConversationById = async (userId, conversationId) => {
    const result = await pool.query(
        `SELECT c.id, c.created_at, c.updated_at,
                COALESCE(json_agg(json_build_object('id', u.id, 'username', u.username, 'avatar_url', u.avatar_url) ORDER BY u.username) FILTER (WHERE u.id IS NOT NULL), '[]') AS participants
         FROM conversations c
         JOIN conversation_members cm ON cm.conversation_id = c.id
         JOIN users u ON u.id = cm.user_id
         WHERE c.id = $1 AND cm.user_id = $2
         GROUP BY c.id
         LIMIT 1`,
        [conversationId, userId]
    );
    return result.rows[0] || null;
};

const findConversationByMembers = async (memberIds) => {
    const sortedIds = [...memberIds].sort();
    const result = await pool.query(
        `SELECT c.id, c.created_at, c.updated_at
         FROM conversations c
         JOIN conversation_members cm ON cm.conversation_id = c.id
         GROUP BY c.id
         HAVING array_agg(DISTINCT cm.user_id ORDER BY cm.user_id) = $1::uuid[]`,
        [sortedIds]
    );
    return result.rows[0] || null;
};

const createConversation = async (memberIds) => {
    const result = await pool.query(
        `INSERT INTO conversations (created_at, updated_at)
         VALUES (NOW(), NOW())
         RETURNING id, created_at, updated_at`,
        []
    );
    const conversation = result.rows[0];
    const queryText = `INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES ${memberIds.map((_, index) => `($1, $${index + 2}, NOW())`).join(', ')}`;
    await pool.query(queryText, [conversation.id, ...memberIds]);
    return conversation;
};

const getOrCreateConversation = async (userId, participantUsernames) => {
    const participants = await userService.getUsersByUsernames(participantUsernames);
    if (participants.length !== participantUsernames.length) {
        throw new Error('One or more participants were not found');
    }

    const participantIds = [...new Set([userId, ...participants.map((u) => u.id)])];
    const existing = await findConversationByMembers(participantIds);
    if (existing) {
        return existing;
    }

    return createConversation(participantIds);
};

module.exports = {
    getConversationsForUser,
    getConversationById,
    getOrCreateConversation,
};
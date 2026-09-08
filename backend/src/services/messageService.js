const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');
const streakService = require('./streakService');
const moderationService = require('./moderationService');

const getMessagesForConversation = async (userId, conversationId) => {
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
                m.moderation_status,
                m.created_at,
                m.read_at
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1
           AND (m.moderation_status IS NULL OR m.moderation_status != 'REJECTED')
           AND m.sender_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = $2)
           AND m.sender_id NOT IN (SELECT user_id FROM blocked_users WHERE blocked_user_id = $2)
         ORDER BY m.created_at ASC`,
        [conversationId, userId]
    );
    return result.rows;
};

const createMessage = async (senderId, conversationId, content) => {
    // 1. Check user restriction
    const restriction = await moderationService.checkUserRestriction(senderId);
    if (restriction.restricted) throw new Error(restriction.reason);

    // 2. Moderate text content
    const textMod = moderationService.moderateText(content);
    if (!textMod.allowed || textMod.status === 'REJECTED') {
        await moderationService.recordUserViolation(senderId, textMod.reason, textMod.isMinorProtection);
        throw new Error("This message can't be sent because it doesn't meet StudyVault's community guidelines.");
    }

    // 3. Moderate attached media if content contains URL or media file reference
    if (content && (content.includes('/uploads/') || content.includes('http://') || content.includes('https://'))) {
        const urlMatches = content.match(/https?:\/\/[^\s]+|\/uploads\/[^\s]+/g);
        if (urlMatches) {
            const uploadBase = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
            for (const urlStr of urlMatches) {
                try {
                    const filename = path.basename(new URL(urlStr, 'http://localhost:5000').pathname);
                    let filePath = path.join(uploadBase, 'public', filename);
                    if (!fs.existsSync(filePath)) filePath = path.join(uploadBase, filename);

                    if (fs.existsSync(filePath)) {
                        const mediaMod = filename.endsWith('.mp4') || filename.endsWith('.webm')
                            ? await moderationService.moderateVideo(filePath)
                            : await moderationService.moderateImage(filePath);

                        if (!mediaMod.allowed || mediaMod.status === 'REJECTED') {
                            await moderationService.recordUserViolation(senderId, mediaMod.reason, mediaMod.isMinorProtection);
                            throw new Error("This media can't be sent because it doesn't meet StudyVault's community guidelines.");
                        }
                    }
                } catch (e) {
                    if (e.message.includes('guidelines')) throw e;
                }
            }
        }
    }

    const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, moderation_status, created_at)
         VALUES ($1, $2, $3, 'APPROVED', NOW())
         RETURNING id, conversation_id, sender_id, content, moderation_status, created_at, read_at`,
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
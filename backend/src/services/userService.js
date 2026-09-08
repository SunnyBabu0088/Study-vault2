const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const env = require('../config/env');
const moderationService = require('./moderationService');

const createUser = async ({ id, username, email, passwordHash, phone, rollNumber, avatarUrl }) => {
    const result = await pool.query(
        `INSERT INTO users (id, username, email, password_hash, phone, roll_number, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, phone, roll_number, avatar_url, streak_count, last_chat_date, created_at, updated_at`,
        [id, username, email, passwordHash, phone || null, rollNumber || null, avatarUrl || null]
    );
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    if (!email) return null;
    const result = await pool.query(
        `SELECT id, username, email, password_hash, phone, roll_number, bio, avatar_url, streak_count, last_chat_date, created_at, updated_at
         FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email.trim()]
    );
    return result.rows[0] || null;
};

const getUserById = async (id) => {
    const result = await pool.query(
        `SELECT id, username, email, phone, roll_number, bio, avatar_url, streak_count, last_chat_date, created_at, updated_at
         FROM users WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] || null;
};

const getUsersByUsernames = async (usernames) => {
    if (!usernames || usernames.length === 0) {
        return [];
    }

    const normalized = [...new Set(usernames.map((name) => String(name).trim().toLowerCase()).filter(Boolean))];
    if (normalized.length === 0) return [];

    const result = await pool.query(
        `SELECT id, username, avatar_url FROM users WHERE LOWER(username) = ANY($1::text[])`,
        [normalized]
    );

    const foundUsers = result.rows;
    const foundUsernamesLower = new Set(foundUsers.map((u) => u.username.toLowerCase()));

    const missingUsernames = normalized.filter((name) => !foundUsernamesLower.has(name));
    if (missingUsernames.length > 0) {
        const crypto = require('crypto');
        const bcrypt = require('bcrypt');
        const defaultHash = await bcrypt.hash('studyvault123', 10);

        for (const missingName of missingUsernames) {
            const capitalized = missingName.charAt(0).toUpperCase() + missingName.slice(1);
            try {
                const newUser = await createUser({
                    id: crypto.randomUUID(),
                    username: capitalized,
                    email: `${missingName}@studyvault.internal`,
                    passwordHash: defaultHash,
                    avatarUrl: `https://api.dicebear.com/6.x/avataaars/svg?seed=${capitalized}`,
                });
                foundUsers.push({ id: newUser.id, username: newUser.username, avatar_url: newUser.avatar_url });
            } catch (err) {
                const retry = await pool.query(
                    `SELECT id, username, avatar_url FROM users WHERE LOWER(username) = $1 LIMIT 1`,
                    [missingName]
                );
                if (retry.rows[0]) {
                    foundUsers.push(retry.rows[0]);
                }
            }
        }
    }

    return foundUsers;
};

const updateUser = async (id, { username, email, phone, rollNumber, bio, avatarUrl, streakCount, lastChatDate }) => {
    // 1. Moderate Bio if updated
    if (bio) {
        const bioMod = moderationService.moderateText(bio);
        if (!bioMod.allowed || bioMod.status === 'REJECTED') {
            throw new Error("Bio blocked: This content doesn't meet StudyVault's community guidelines.");
        }
    }

    // 2. Moderate Avatar if updated
    if (avatarUrl) {
        let filePath = avatarUrl;
        const uploadBase = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
        try {
            if (avatarUrl.includes('/')) {
                const aName = path.basename(new URL(avatarUrl, 'http://localhost:5000').pathname);
                const publicPath = path.join(uploadBase, 'public', aName);
                if (fs.existsSync(publicPath)) filePath = publicPath;
                else filePath = path.join(uploadBase, aName);
            }
        } catch (e) {}

        const avatarMod = await moderationService.moderateImage(filePath);
        if (!avatarMod.allowed || avatarMod.status === 'REJECTED') {
            await moderationService.recordUserViolation(id, avatarMod.reason, avatarMod.isMinorProtection);
            throw new Error("Please choose a different profile picture. This image isn't allowed on StudyVault.");
        }
    }

    const result = await pool.query(
        `UPDATE users
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             phone = $3,
             roll_number = $4,
             avatar_url = COALESCE($5, avatar_url),
             bio = COALESCE($6, bio),
             streak_count = COALESCE($7, streak_count),
             last_chat_date = COALESCE($8, last_chat_date),
             updated_at = NOW()
         WHERE id = $9
         RETURNING id, username, email, phone, roll_number, bio, avatar_url, streak_count, last_chat_date, created_at, updated_at`,
        [username || null, email || null, phone || null, rollNumber || null, avatarUrl || null, bio || null, streakCount ?? null, lastChatDate ?? null, id]
    );
    return result.rows[0] || null;
};

const deleteUser = async (id) => {
    const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
};

const createPasswordResetToken = async (email) => {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await pool.query(`DELETE FROM password_resets WHERE user_id = $1`, [user.id]);
    await pool.query(
        `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, token, expiresAt]
    );

    return { token, email: user.email };
};

const resetPasswordWithToken = async (token, newPassword) => {
    const bcrypt = require('bcrypt');
    const resetRes = await pool.query(
        `SELECT user_id FROM password_resets WHERE token = $1 AND expires_at > NOW() LIMIT 1`,
        [token]
    );

    if (resetRes.rows.length === 0) {
        return false;
    }

    const userId = resetRes.rows[0].user_id;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, userId]);
    await pool.query(`DELETE FROM password_resets WHERE user_id = $1`, [userId]);

    return true;
};

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    getUsersByUsernames,
    updateUser,
    deleteUser,
    createPasswordResetToken,
    resetPasswordWithToken,
};

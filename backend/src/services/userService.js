const { pool } = require('../config/database');

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
    const result = await pool.query(
        `SELECT id, username, email, password_hash, phone, roll_number, avatar_url, streak_count, last_chat_date, created_at, updated_at
         FROM users WHERE email = $1 LIMIT 1`,
        [email]
    );
    return result.rows[0] || null;
};

const getUserById = async (id) => {
    const result = await pool.query(
        `SELECT id, username, email, phone, roll_number, avatar_url, streak_count, last_chat_date, created_at, updated_at
         FROM users WHERE id = $1 LIMIT 1`,
        [id]
    );
    return result.rows[0] || null;
};

const getUsersByUsernames = async (usernames) => {
    if (!usernames || usernames.length === 0) {
        return [];
    }

    const result = await pool.query(
        `SELECT id, username, avatar_url FROM users WHERE LOWER(username) = ANY($1::text[])`,
        [usernames.map((name) => name.toLowerCase())]
    );
    return result.rows;
};

const updateUser = async (id, { username, email, phone, rollNumber, avatarUrl, streakCount, lastChatDate }) => {
    const result = await pool.query(
        `UPDATE users
         SET username = $1,
             email = $2,
             phone = $3,
             roll_number = $4,
             avatar_url = $5,
             streak_count = COALESCE($6, streak_count),
             last_chat_date = COALESCE($7, last_chat_date),
             updated_at = NOW()
         WHERE id = $8
         RETURNING id, username, email, phone, roll_number, avatar_url, streak_count, last_chat_date, created_at, updated_at`,
        [username, email, phone || null, rollNumber || null, avatarUrl || null, streakCount ?? null, lastChatDate ?? null, id]
    );
    return result.rows[0] || null;
};

module.exports = { createUser, getUserByEmail, getUserById, getUsersByUsernames, updateUser };

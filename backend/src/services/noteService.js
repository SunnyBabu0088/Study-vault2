const { pool } = require('../config/database');

const getNotesByUser = async (userId, limit, offset) => {
    const result = await pool.query(
        `SELECT id, user_id, title, content, theme, created_at, updated_at
     FROM notes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

const countNotesByUser = async (userId) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notes WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0]?.count || 0;
};

const getNoteById = async (userId, id) => {
    const result = await pool.query(
        `SELECT id, user_id, title, content, theme, created_at, updated_at
     FROM notes
     WHERE user_id = $1 AND id = $2
     LIMIT 1`,
        [userId, id]
    );
    return result.rows[0] || null;
};

const createNote = async ({ userId, title, content, theme }) => {
    const result = await pool.query(
        `INSERT INTO notes (user_id, title, content, theme)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, title, content, theme, created_at, updated_at`,
        [userId, title, content, theme]
    );
    return result.rows[0];
};

const updateNote = async (userId, id, fields) => {
    const updates = [];
    const values = [userId, id];
    let idx = 3;

    Object.entries(fields).forEach(([key, value]) => {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx += 1;
    });

    if (updates.length === 0) {
        return getNoteById(userId, id);
    }

    const result = await pool.query(
        `UPDATE notes SET ${updates.join(', ')}, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING id, user_id, title, content, theme, created_at, updated_at`,
        values
    );
    return result.rows[0] || null;
};

const deleteNote = async (userId, id) => {
    const result = await pool.query(
        `DELETE FROM notes WHERE user_id = $1 AND id = $2`,
        [userId, id]
    );
    return result.rowCount > 0;
};

module.exports = { getNotesByUser, countNotesByUser, getNoteById, createNote, updateNote, deleteNote };

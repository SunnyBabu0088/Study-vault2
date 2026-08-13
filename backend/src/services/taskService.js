const { pool } = require('../config/database');

const getTasksByUser = async (userId, limit, offset) => {
    const result = await pool.query(
        `SELECT id, user_id, subject, title, content, priority, due_date, completed, created_at, updated_at
     FROM study_tasks
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
};

const countTasksByUser = async (userId) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM study_tasks WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0]?.count || 0;
};

const getTaskById = async (userId, id) => {
    const result = await pool.query(
        `SELECT id, user_id, subject, title, content, priority, due_date, completed, created_at, updated_at
     FROM study_tasks
     WHERE user_id = $1 AND id = $2
     LIMIT 1`,
        [userId, id]
    );
    return result.rows[0] || null;
};

const createTask = async ({ userId, subject, title, content, priority, due_date, completed }) => {
    const result = await pool.query(
        `INSERT INTO study_tasks (user_id, subject, title, content, priority, due_date, completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, subject, title, content, priority, due_date, completed, created_at, updated_at`,
        [userId, subject, title, content, priority, due_date || null, completed || false]
    );
    return result.rows[0];
};

const updateTask = async (userId, id, fields) => {
    const updates = [];
    const values = [userId, id];
    let idx = 3;

    Object.entries(fields).forEach(([key, value]) => {
        updates.push(`${key} = $${idx}`);
        values.push(value);
        idx += 1;
    });

    if (updates.length === 0) {
        return getTaskById(userId, id);
    }

    const result = await pool.query(
        `UPDATE study_tasks SET ${updates.join(', ')}, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING id, user_id, subject, title, content, priority, due_date, completed, created_at, updated_at`,
        values
    );
    return result.rows[0] || null;
};

const deleteTask = async (userId, id) => {
    const result = await pool.query(
        `DELETE FROM study_tasks WHERE user_id = $1 AND id = $2`,
        [userId, id]
    );
    return result.rowCount > 0;
};

const setTaskCompleted = async (userId, id, completed) => {
    const result = await pool.query(
        `UPDATE study_tasks SET completed = $3, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING id, user_id, subject, title, content, priority, due_date, completed, created_at, updated_at`,
        [userId, id, completed]
    );
    return result.rows[0] || null;
};

module.exports = { getTasksByUser, countTasksByUser, getTaskById, createTask, updateTask, deleteTask, setTaskCompleted };

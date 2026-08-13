const taskService = require('../services/taskService');
const { validateTaskPayload, validateIdParam, validatePagination } = require('../utils/validators');

const listTasks = async (req, res, next) => {
    try {
        const { page, limit } = validatePagination(req.query);
        const offset = (page - 1) * limit;

        const [items, total] = await Promise.all([
            taskService.getTasksByUser(req.user.id, limit, offset),
            taskService.countTasksByUser(req.user.id),
        ]);

        return res.json({ data: items, page, limit, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

const getTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid task id' });
        }

        const task = await taskService.getTaskById(req.user.id, id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ data: task });
    } catch (error) {
        next(error);
    }
};

const createTask = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateTaskPayload(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const task = await taskService.createTask({ userId: req.user.id, ...sanitized });
        return res.status(201).json({ data: task });
    } catch (error) {
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid task id' });
        }

        const { valid, errors, sanitized } = validateTaskPayload(req.body, true);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const task = await taskService.updateTask(req.user.id, id, sanitized);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ data: task });
    } catch (error) {
        next(error);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid task id' });
        }

        const deleted = await taskService.deleteTask(req.user.id, id);
        if (!deleted) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const completeTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid task id' });
        }

        const completed = req.body.completed !== undefined ? Boolean(req.body.completed) : true;
        const task = await taskService.setTaskCompleted(req.user.id, id, completed);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ data: task });
    } catch (error) {
        next(error);
    }
};

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };

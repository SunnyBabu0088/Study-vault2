const noteService = require('../services/noteService');
const { validateNotePayload, validateIdParam, validatePagination } = require('../utils/validators');

const listNotes = async (req, res, next) => {
    try {
        const { page, limit } = validatePagination(req.query);
        const offset = (page - 1) * limit;

        const [items, total] = await Promise.all([
            noteService.getNotesByUser(req.user.id, limit, offset),
            noteService.countNotesByUser(req.user.id),
        ]);

        return res.json({ data: items, page, limit, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

const getNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid note id' });
        }

        const note = await noteService.getNoteById(req.user.id, id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        return res.json({ data: note });
    } catch (error) {
        next(error);
    }
};

const createNote = async (req, res, next) => {
    try {
        const { valid, errors, sanitized } = validateNotePayload(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const note = await noteService.createNote({ userId: req.user.id, ...sanitized });
        return res.status(201).json({ data: note });
    } catch (error) {
        next(error);
    }
};

const updateNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid note id' });
        }

        const { valid, errors, sanitized } = validateNotePayload(req.body, true);
        if (!valid) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        const note = await noteService.updateNote(req.user.id, id, sanitized);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        return res.json({ data: note });
    } catch (error) {
        next(error);
    }
};

const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!validateIdParam(id)) {
            return res.status(400).json({ error: 'Invalid note id' });
        }

        const deleted = await noteService.deleteNote(req.user.id, id);
        if (!deleted) {
            return res.status(404).json({ error: 'Note not found' });
        }

        return res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { listNotes, getNote, createNote, updateNote, deleteNote };

const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    listNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
} = require('../controllers/noteController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listNotes);
router.get('/:id', getNote);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;

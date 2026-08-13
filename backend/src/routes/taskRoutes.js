const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    listTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
} = require('../controllers/taskController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/complete', completeTask);

module.exports = router;

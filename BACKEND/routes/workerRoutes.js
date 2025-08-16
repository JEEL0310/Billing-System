const express = require('express');
const router = express.Router();
const {
  createWorker,
  getWorkers,
  getWorkerById,
  updateWorker,
  deleteWorker,
} = require('../controllers/workerController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes in this file are protected and require admin access
router.use(protect);
router.use(isAdmin);

router.route('/')
  .post(createWorker)
  .get(getWorkers);

router.route('/:id')
  .get(getWorkerById)
  .put(updateWorker)
  .delete(deleteWorker);

module.exports = router;
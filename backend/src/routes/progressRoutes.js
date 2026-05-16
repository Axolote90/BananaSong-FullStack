const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const authenticateToken = require('../middlewares/authMiddleware');

// POST http://localhost:3000/api/progress
router.post('/', authenticateToken, progressController.saveProgress);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Ruta para obtener el ranking (pública o privada, según prefieras)
router.get('/leaderboard', userController.getLeaderboard);

// Ruta para actualizar el perfil (requiere autenticación)
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;

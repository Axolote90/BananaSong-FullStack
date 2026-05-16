const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limita cada IP a 10 peticiones para endpoints de autenticación
    message: { message: 'Demasiados intentos. Por favor, inténtalo más tarde.' }
});

// Ruta para registrarse: POST http://localhost:3000/api/auth/register
router.post('/register', authLimiter, [
    body('username').notEmpty().withMessage('Usuario es requerido').isLength({ min: 3 }).withMessage('El usuario debe tener al menos 3 caracteres'),
    body('password').notEmpty().withMessage('Contraseña es requerida').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], validateRequest, authController.register);

// Ruta para iniciar sesión: POST http://localhost:3000/api/auth/login
router.post('/login', authLimiter, [
    body('username').notEmpty().withMessage('Usuario es requerido'),
    body('password').notEmpty().withMessage('Contraseña es requerida')
], validateRequest, authController.login);

// Ruta para obtener perfil del usuario logueado: GET http://localhost:3000/api/auth/profile
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
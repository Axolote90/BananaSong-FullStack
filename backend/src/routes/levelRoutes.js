const express = require('express');
const router = express.Router();
const levelController = require('../controllers/levelController');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');

// Ruta para ver todos los niveles: GET http://localhost:3000/api/levels
router.get('/', levelController.getAllLevels);

// Ruta para ver un nivel específico: GET http://localhost:3000/api/levels/ID
router.get('/:id', levelController.getLevelById);

// Ruta para crear un nivel: POST http://localhost:3000/api/levels
router.post('/', [
    body('title').notEmpty().withMessage('El título es requerido'),
    body('difficulty').isInt({ min: 1 }).withMessage('La dificultad debe ser un número entero positivo'),
    body('bpm').isInt({ min: 1 }).withMessage('Los BPM deben ser un número entero positivo'),
    body('track_data').notEmpty().withMessage('Los datos de la pista son requeridos')
], validateRequest, levelController.createLevel);

module.exports = router;
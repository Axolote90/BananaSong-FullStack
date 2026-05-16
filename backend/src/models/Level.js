// backend/src/models/Level.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Level = sequelize.define('Level', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'easy'
    },
    bpm: {
        type: DataTypes.INTEGER, // Beats por minuto, para controlar la velocidad del scroll
        defaultValue: 80
    },
    // Aquí vive la "partitura" en formato JSON
    track_data: {
        type: DataTypes.TEXT, 
        allowNull: false,
        get() {
            // Al leer de la DB, lo convierte automáticamente de String a Objeto JS
            const rawValue = this.getDataValue('track_data');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            // Al guardar en la DB, lo convierte automáticamente de Objeto a String
            this.setDataValue('track_data', JSON.stringify(value));
        }
    }
});

module.exports = Level;
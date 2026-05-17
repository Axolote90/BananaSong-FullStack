// backend/src/models/Level.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Level = sequelize.define('Level', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    difficultyId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    instrument: {
        type: DataTypes.STRING,
        defaultValue: 'ukulele' 
    },
    bpm: {
        type: DataTypes.INTEGER, 
        defaultValue: 80
    },
    // Aquí vive la "partitura" en formato JSON
    track_data: {
        type: DataTypes.TEXT, 
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('track_data');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('track_data', JSON.stringify(value));
        }
    }
}, {
    tableName: 'levels'
});

// Getter en el prototipo para retrocompatibilidad transparente
Object.defineProperty(Level.prototype, 'difficulty', {
    get() {
        return this.Difficulty ? this.Difficulty.level : 'easy';
    }
});

module.exports = Level;
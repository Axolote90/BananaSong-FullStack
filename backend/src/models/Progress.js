const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Progress = sequelize.define('Progress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    stars: {
        type: DataTypes.INTEGER,
        validate: { min: 0, max: 3 },
        defaultValue: 0
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxCombo: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    accuracy: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    instrumentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'progress'
});

// Getter en el prototipo para retrocompatibilidad transparente
Object.defineProperty(Progress.prototype, 'instrument', {
    get() {
        return this.Instrument ? this.Instrument.name : 'ukulele';
    }
});

module.exports = Progress;
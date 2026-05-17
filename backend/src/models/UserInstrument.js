const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserInstrument = sequelize.define('UserInstrument', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    instrumentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    badges: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    }
}, {
    tableName: 'user_instruments',
    // Índice único para evitar duplicados por usuario/instrumento
    indexes: [
        {
            unique: true,
            fields: ['userId', 'instrumentId']
        }
    ]
});

// Getter en el prototipo para retrocompatibilidad transparente
Object.defineProperty(UserInstrument.prototype, 'instrument', {
    get() {
        return this.Instrument ? this.Instrument.name : null;
    }
});

module.exports = UserInstrument;

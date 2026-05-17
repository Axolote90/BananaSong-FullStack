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
    instrument: {
        type: DataTypes.STRING,
        allowNull: false
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
    // Índice único para evitar duplicados por usuario/instrumento
    indexes: [
        {
            unique: true,
            fields: ['userId', 'instrument']
        }
    ]
});

module.exports = UserInstrument;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Difficulty = sequelize.define('Difficulty', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'difficulties',
    timestamps: false
});

module.exports = Difficulty;

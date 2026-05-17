const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instrument = sequelize.define('Instrument', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'instruments',
    timestamps: false
});

module.exports = Instrument;

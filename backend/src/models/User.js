const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    imgProfile: {
        type: DataTypes.BLOB('long'), // Usar long para base64 largos
        allowNull: true
    },
    profile: { // Alias para conversión automática
        type: DataTypes.VIRTUAL,
        get() {
            if (!this.imgProfile) return null;
            const str = this.imgProfile.toString();
            // Si ya es una dataURL (empieza por data:), la devolvemos tal cual
            if (str.startsWith('data:image')) return str;
            // Si es binario puro (Buffer), lo convertimos a base64 con el prefijo correcto
            const base64 = this.imgProfile.toString('base64');
            return `data:image/png;base64,${base64}`;
        },
        set(value) {
            this.imgProfile = value;
        }
    },
    bio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    hearts: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Temporalmente true para evitar error de validación con registros existentes
        unique: true,
        validate: { isEmail: true }
    },
    isConfirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    confirmationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Instrumentos que ya toca (formato JSON: { "ukulele": "beginner", "guitar": "none" })
    knownInstruments: {
        type: DataTypes.JSON,
        allowNull: true
    },
    // Instrumento que está aprendiendo actualmente
    targetInstrument: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Nivel general o específico
    skillLevel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastLoginDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastHeartRegenDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = User;
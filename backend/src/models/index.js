const User = require('./User');
const Level = require('./Level');
const Progress = require('./Progress');
const UserInstrument = require('./UserInstrument');
const Difficulty = require('./Difficulty');
const Instrument = require('./Instrument');

// --- CONFIGURACIÓN DE RELACIONES (SQL Asociaciones) ---

// 1. Relación User <-> Progress (1:N)
User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId' });

// 2. Relación Level <-> Progress (1:N)
Level.hasMany(Progress, { foreignKey: 'levelId', onDelete: 'CASCADE' });
Progress.belongsTo(Level, { foreignKey: 'levelId' });

// 3. Relación User <-> UserInstrument (1:N)
User.hasMany(UserInstrument, { foreignKey: 'userId', as: 'instrumentStats', onDelete: 'CASCADE' });
UserInstrument.belongsTo(User, { foreignKey: 'userId' });

// 4. Relación Difficulty <-> Level (1:N)
Difficulty.hasMany(Level, { foreignKey: 'difficultyId', onDelete: 'SET NULL' });
Level.belongsTo(Difficulty, { foreignKey: 'difficultyId' });

// 5. Relación Instrument <-> Progress (1:N)
Instrument.hasMany(Progress, { foreignKey: 'instrumentId', onDelete: 'SET NULL' });
Progress.belongsTo(Instrument, { foreignKey: 'instrumentId' });

// 6. Relación Instrument <-> UserInstrument (1:N)
Instrument.hasMany(UserInstrument, { foreignKey: 'instrumentId', onDelete: 'CASCADE' });
UserInstrument.belongsTo(Instrument, { foreignKey: 'instrumentId' });

module.exports = {
    User,
    Level,
    Progress,
    UserInstrument,
    Difficulty,
    Instrument
};

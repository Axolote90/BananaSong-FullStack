const User = require('./User');
const Level = require('./Level');
const Progress = require('./Progress');
const UserInstrument = require('./UserInstrument');

// RELACIONES
// Un usuario tiene muchos progresos (partidas terminadas)
User.hasMany(Progress, { foreignKey: 'userId' });
Progress.belongsTo(User, { foreignKey: 'userId' });

// Un nivel tiene muchos progresos
Level.hasMany(Progress, { foreignKey: 'levelId' });
Progress.belongsTo(Level, { foreignKey: 'levelId' });

// Un usuario tiene muchas estadísticas por instrumento
User.hasMany(UserInstrument, { foreignKey: 'userId', as: 'instrumentStats' });
UserInstrument.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Level,
    Progress,
    UserInstrument
};

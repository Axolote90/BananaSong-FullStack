const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuramos la instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,   // banana_song_db
    process.env.DB_USER,   // root
    process.env.DB_PASS,   // tu contraseña
    {
        host: process.env.DB_HOST, // localhost
        dialect: 'mysql',          // Le decimos que use el driver de MySQL
        logging: false,            // Para que no ensucie la consola con cada comando SQL
        port: 3306                 // El puerto de la DB que mencionábamos antes
    }
);

// Exportamos la instancia para que app.js y los modelos puedan usarla
module.exports = sequelize;
const sequelize = require('./src/config/db');
const Level = require('./models/Level');

const seedDatabase = async () => {
    try {
        // 1. Conectar y sincronizar
        await sequelize.sync({ force: false });

        // 2. Definir la canción (La "Semilla")
        const cancionDePrueba = {
            title: "Ukelele 101: Cuerdas al aire",
            difficulty: "easy",
            bpm: 90,
            track_data: [
                { time: 1000, string: 4, fret: 0 }, // Cuerda G
                { time: 2000, string: 3, fret: 0 }, // Cuerda C
                { time: 3000, string: 2, fret: 0 }, // Cuerda E
                { time: 4000, string: 1, fret: 0 }  // Cuerda A
            ]
        };

        // 3. Insertar en la DB
        await Level.create(cancionDePrueba);

        console.log("🌱 ¡Base de datos sembrada con éxito!");
        process.exit(); // Cerrar el script
    } catch (error) {
        console.error("❌ Error al sembrar datos:", error);
        process.exit(1);
    }
};

seedDatabase();
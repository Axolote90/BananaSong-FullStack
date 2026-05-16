const sequelize = require('./src/config/db');
const Level = require('./src/models/Level');

const trackData = [
  // La cu-ca
  { time: 0, string: 3, fret: 0, name: "C4" },
  { time: 500, string: 3, fret: 0, name: "C4" },
  { time: 1000, string: 3, fret: 0, name: "C4" },
  // ra - cha
  { time: 1500, string: 2, fret: 1, name: "F4" },
  { time: 2500, string: 1, fret: 0, name: "A4" },

  // La cu-ca
  { time: 4000, string: 3, fret: 0, name: "C4" },
  { time: 4500, string: 3, fret: 0, name: "C4" },
  { time: 5000, string: 3, fret: 0, name: "C4" },
  // ra - cha
  { time: 5500, string: 2, fret: 1, name: "F4" },
  { time: 6500, string: 1, fret: 0, name: "A4" },

  // ya no pue-de ca-mi-nar
  { time: 8000, string: 2, fret: 1, name: "F4" },
  { time: 8500, string: 2, fret: 1, name: "F4" },
  { time: 9000, string: 2, fret: 0, name: "E4" },
  { time: 9500, string: 2, fret: 0, name: "E4" },
  { time: 10000, string: 3, fret: 2, name: "D4" },
  { time: 10500, string: 3, fret: 2, name: "D4" },
  { time: 11000, string: 3, fret: 0, name: "C4" }
];

async function seedCucaracha() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida.');
    
    await Level.create({
      title: "La Cucaracha",
      difficulty: "easy",
      bpm: 120,
      track_data: trackData
    });

    console.log('La Cucaracha insertada con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('Error insertando la cucaracha:', err);
    process.exit(1);
  }
}

seedCucaracha();

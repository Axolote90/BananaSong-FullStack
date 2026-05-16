const sequelize = require('./src/config/db');
const Level = require('./src/models/Level');

const songs = [
  {
    title: "Estrellita Dónde Estás (Twinkle Twinkle)",
    difficulty: "easy",
    bpm: 100,
    track_data: [
      // C C G G A A G
      { time: 0, string: 3, fret: 0, name: "C4" },
      { time: 600, string: 3, fret: 0, name: "C4" },
      { time: 1200, string: 2, fret: 3, name: "G4" },
      { time: 1800, string: 2, fret: 3, name: "G4" },
      { time: 2400, string: 1, fret: 0, name: "A4" },
      { time: 3000, string: 1, fret: 0, name: "A4" },
      { time: 3600, string: 2, fret: 3, name: "G4" }, // half note
      
      // F F E E D D C
      { time: 4800, string: 2, fret: 1, name: "F4" },
      { time: 5400, string: 2, fret: 1, name: "F4" },
      { time: 6000, string: 2, fret: 0, name: "E4" },
      { time: 6600, string: 2, fret: 0, name: "E4" },
      { time: 7200, string: 3, fret: 2, name: "D4" },
      { time: 7800, string: 3, fret: 2, name: "D4" },
      { time: 8400, string: 3, fret: 0, name: "C4" }
    ]
  },
  {
    title: "Himno a la Alegría (Ode to Joy)",
    difficulty: "medium",
    bpm: 110,
    track_data: [
      // E E F G
      { time: 0, string: 2, fret: 0, name: "E4" },
      { time: 545, string: 2, fret: 0, name: "E4" },
      { time: 1090, string: 2, fret: 1, name: "F4" },
      { time: 1635, string: 2, fret: 3, name: "G4" },
      // G F E D
      { time: 2180, string: 2, fret: 3, name: "G4" },
      { time: 2725, string: 2, fret: 1, name: "F4" },
      { time: 3270, string: 2, fret: 0, name: "E4" },
      { time: 3815, string: 3, fret: 2, name: "D4" },
      // C C D E
      { time: 4360, string: 3, fret: 0, name: "C4" },
      { time: 4905, string: 3, fret: 0, name: "C4" },
      { time: 5450, string: 3, fret: 2, name: "D4" },
      { time: 5995, string: 2, fret: 0, name: "E4" },
      // E D D
      { time: 6540, string: 2, fret: 0, name: "E4" }, // dotted
      { time: 7357, string: 3, fret: 2, name: "D4" }, // short
      { time: 7630, string: 3, fret: 2, name: "D4" }  // half
    ]
  },
  {
    title: "María tenía un corderito",
    difficulty: "easy",
    bpm: 120,
    track_data: [
      // E D C D
      { time: 0, string: 2, fret: 0, name: "E4" },
      { time: 500, string: 3, fret: 2, name: "D4" },
      { time: 1000, string: 3, fret: 0, name: "C4" },
      { time: 1500, string: 3, fret: 2, name: "D4" },
      // E E E
      { time: 2000, string: 2, fret: 0, name: "E4" },
      { time: 2500, string: 2, fret: 0, name: "E4" },
      { time: 3000, string: 2, fret: 0, name: "E4" },
      // D D D
      { time: 4000, string: 3, fret: 2, name: "D4" },
      { time: 4500, string: 3, fret: 2, name: "D4" },
      { time: 5000, string: 3, fret: 2, name: "D4" },
      // E G G
      { time: 6000, string: 2, fret: 0, name: "E4" },
      { time: 6500, string: 2, fret: 3, name: "G4" },
      { time: 7000, string: 2, fret: 3, name: "G4" }
    ]
  },
  {
    title: "Martinillo (Frère Jacques)",
    difficulty: "easy",
    bpm: 110,
    track_data: [
      // C D E C
      { time: 0, string: 3, fret: 0, name: "C4" },
      { time: 545, string: 3, fret: 2, name: "D4" },
      { time: 1090, string: 2, fret: 0, name: "E4" },
      { time: 1635, string: 3, fret: 0, name: "C4" },
      // C D E C
      { time: 2180, string: 3, fret: 0, name: "C4" },
      { time: 2725, string: 3, fret: 2, name: "D4" },
      { time: 3270, string: 2, fret: 0, name: "E4" },
      { time: 3815, string: 3, fret: 0, name: "C4" },
      // E F G
      { time: 4360, string: 2, fret: 0, name: "E4" },
      { time: 4905, string: 2, fret: 1, name: "F4" },
      { time: 5450, string: 2, fret: 3, name: "G4" }, // half
      // E F G
      { time: 6540, string: 2, fret: 0, name: "E4" },
      { time: 7085, string: 2, fret: 1, name: "F4" },
      { time: 7630, string: 2, fret: 3, name: "G4" }  // half
    ]
  },
  {
    title: "Cumpleaños Feliz",
    difficulty: "medium",
    bpm: 90,
    track_data: [
      // C C D C F E
      { time: 0, string: 3, fret: 0, name: "C4" },
      { time: 333, string: 3, fret: 0, name: "C4" },
      { time: 666, string: 3, fret: 2, name: "D4" },
      { time: 1332, string: 3, fret: 0, name: "C4" },
      { time: 1998, string: 2, fret: 1, name: "F4" },
      { time: 2664, string: 2, fret: 0, name: "E4" }, // half
      // C C D C G F
      { time: 3996, string: 3, fret: 0, name: "C4" },
      { time: 4329, string: 3, fret: 0, name: "C4" },
      { time: 4662, string: 3, fret: 2, name: "D4" },
      { time: 5328, string: 3, fret: 0, name: "C4" },
      { time: 5994, string: 2, fret: 3, name: "G4" },
      { time: 6660, string: 2, fret: 1, name: "F4" }
    ]
  }
];

async function seedClassics() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida.');
    
    for (const song of songs) {
      await Level.create(song);
      console.log(`Insertada: ${song.title}`);
    }

    console.log('Todas las melodías insertadas con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('Error insertando canciones:', err);
    process.exit(1);
  }
}

seedClassics();

const sequelize = require('./src/config/db');
const Level = require('./src/models/Level');

const expandedSongs = [
  // GUITARRA ACÚSTICA
  {
    title: "Guitarra Acústica 101: Cuerdas al aire",
    difficulty: "easy",
    bpm: 80,
    instrument: "guitar_acoustic",
    track_data: [
      { time: 1000, string: 6, fret: 0, name: "E2" },
      { time: 2000, string: 5, fret: 0, name: "A2" },
      { time: 3000, string: 4, fret: 0, name: "D3" },
      { time: 4000, string: 3, fret: 0, name: "G3" },
      { time: 5000, string: 2, fret: 0, name: "B3" },
      { time: 6000, string: 1, fret: 0, name: "E4" }
    ]
  },
  {
    title: "Twinkle Twinkle (Guitarra Acústica)",
    difficulty: "medium",
    bpm: 90,
    instrument: "guitar_acoustic",
    track_data: [
      { time: 0, string: 2, fret: 1, name: "C4" },
      { time: 600, string: 2, fret: 1, name: "C4" },
      { time: 1200, string: 3, fret: 0, name: "G3" },
      { time: 1800, string: 3, fret: 0, name: "G3" },
      { time: 2400, string: 3, fret: 2, name: "A3" },
      { time: 3000, string: 3, fret: 2, name: "A3" },
      { time: 3600, string: 3, fret: 0, name: "G3" },
      
      { time: 4800, string: 4, fret: 3, name: "F3" },
      { time: 5400, string: 4, fret: 3, name: "F3" },
      { time: 6000, string: 4, fret: 2, name: "E3" },
      { time: 6600, string: 4, fret: 2, name: "E3" },
      { time: 7200, string: 4, fret: 0, name: "D3" },
      { time: 7800, string: 4, fret: 0, name: "D3" },
      { time: 8400, string: 5, fret: 3, name: "C3" }
    ]
  },
  {
    title: "Himno a la Alegría (Guitarra Acústica)",
    difficulty: "easy",
    bpm: 90,
    instrument: "guitar_acoustic",
    track_data: [
      { time: 0, string: 2, fret: 1, name: "C4" },
      { time: 600, string: 2, fret: 1, name: "C4" },
      { time: 1200, string: 2, fret: 3, name: "D4" },
      { time: 1800, string: 1, fret: 0, name: "E4" },
      { time: 2400, string: 1, fret: 0, name: "E4" },
      { time: 3000, string: 2, fret: 3, name: "D4" },
      { time: 3600, string: 2, fret: 1, name: "C4" },
      { time: 4200, string: 2, fret: 0, name: "B3" },
      { time: 4800, string: 3, fret: 2, name: "A3" },
      { time: 5400, string: 3, fret: 2, name: "A3" },
      { time: 6000, string: 2, fret: 0, name: "B3" },
      { time: 6600, string: 2, fret: 1, name: "C4" },
      { time: 7200, string: 2, fret: 1, name: "C4" },
      { time: 7800, string: 2, fret: 0, name: "B3" },
      { time: 8400, string: 2, fret: 0, name: "B3" }
    ]
  },
  {
    title: "María tenía un corderito (Guitarra)",
    difficulty: "easy",
    bpm: 90,
    instrument: "guitar_acoustic",
    track_data: [
      { time: 0, string: 1, fret: 0, name: "E4" },
      { time: 600, string: 2, fret: 3, name: "D4" },
      { time: 1200, string: 2, fret: 1, name: "C4" },
      { time: 1800, string: 2, fret: 3, name: "D4" },
      { time: 2400, string: 1, fret: 0, name: "E4" },
      { time: 3000, string: 1, fret: 0, name: "E4" },
      { time: 3600, string: 1, fret: 0, name: "E4" },
      { time: 4800, string: 2, fret: 3, name: "D4" },
      { time: 5400, string: 2, fret: 3, name: "D4" },
      { time: 6000, string: 2, fret: 3, name: "D4" },
      { time: 7200, string: 1, fret: 0, name: "E4" },
      { time: 7800, string: 1, fret: 3, name: "G4" },
      { time: 8400, string: 1, fret: 3, name: "G4" }
    ]
  },
  {
    title: "La Cucaracha (Guitarra)",
    difficulty: "easy",
    bpm: 100,
    instrument: "guitar_acoustic",
    track_data: [
      { time: 0, string: 2, fret: 1, name: "C4" },
      { time: 300, string: 2, fret: 1, name: "C4" },
      { time: 600, string: 2, fret: 1, name: "C4" },
      { time: 900, string: 1, fret: 1, name: "F4" },
      { time: 1500, string: 1, fret: 5, name: "A4" },
      { time: 2400, string: 2, fret: 1, name: "C4" },
      { time: 2700, string: 2, fret: 1, name: "C4" },
      { time: 3000, string: 2, fret: 1, name: "C4" },
      { time: 3300, string: 1, fret: 1, name: "F4" },
      { time: 3900, string: 1, fret: 5, name: "A4" }
    ]
  },

  // GUITARRA ELÉCTRICA
  {
    title: "Guitarra Eléctrica 101: Riff al aire",
    difficulty: "easy",
    bpm: 90,
    instrument: "guitar_electric",
    track_data: [
      { time: 1000, string: 6, fret: 0, name: "E2" },
      { time: 2000, string: 5, fret: 0, name: "A2" },
      { time: 3000, string: 6, fret: 0, name: "E2" },
      { time: 4000, string: 5, fret: 0, name: "A2" }
    ]
  },
  {
    title: "Riff de Rock Clásico (Smoke on the Water)",
    difficulty: "hard",
    bpm: 110,
    instrument: "guitar_electric",
    track_data: [
      { time: 0, string: 6, fret: 0, name: "E2" },
      { time: 600, string: 6, fret: 3, name: "G2" },
      { time: 1200, string: 5, fret: 0, name: "A2" },
      
      { time: 2000, string: 6, fret: 0, name: "E2" },
      { time: 2600, string: 6, fret: 3, name: "G2" },
      { time: 3200, string: 4, fret: 1, name: "D#3" },
      { time: 3800, string: 5, fret: 0, name: "A2" },
      
      { time: 4600, string: 6, fret: 0, name: "E2" },
      { time: 5200, string: 6, fret: 3, name: "G2" },
      { time: 5800, string: 5, fret: 0, name: "A2" },
      
      { time: 6600, string: 6, fret: 3, name: "G2" },
      { time: 7200, string: 6, fret: 0, name: "E2" }
    ]
  },

  // VIOLÍN
  {
    title: "Violín 101: Cuerdas al aire",
    difficulty: "easy",
    bpm: 80,
    instrument: "violin",
    track_data: [
      { time: 1000, string: 4, fret: 0, name: "G3" },
      { time: 2000, string: 3, fret: 0, name: "D4" },
      { time: 3000, string: 2, fret: 0, name: "A4" },
      { time: 4000, string: 1, fret: 0, name: "E5" }
    ]
  },
  {
    title: "Himno a la Alegría (Violín)",
    difficulty: "medium",
    bpm: 100,
    instrument: "violin",
    track_data: [
      { time: 0, string: 3, fret: 2, name: "E4" },
      { time: 600, string: 3, fret: 2, name: "E4" },
      { time: 1200, string: 3, fret: 4, name: "F#4" },
      { time: 1800, string: 3, fret: 5, name: "G4" },
      
      { time: 2400, string: 3, fret: 5, name: "G4" },
      { time: 3000, string: 3, fret: 4, name: "F#4" },
      { time: 3600, string: 3, fret: 2, name: "E4" },
      { time: 4200, string: 3, fret: 0, name: "D4" }
    ]
  },

  // FLAUTA DULCE (PENTAGRAMA)
  {
    title: "Flauta Dulce 101: Escala Básica",
    difficulty: "easy",
    bpm: 80,
    instrument: "flute",
    track_data: [
      { time: 1000, string: 1, fret: 0, name: "C4" },
      { time: 2000, string: 2, fret: 0, name: "D4" },
      { time: 3000, string: 3, fret: 0, name: "E4" },
      { time: 4000, string: 4, fret: 0, name: "F4" },
      { time: 5000, string: 5, fret: 0, name: "G4" },
      { time: 6000, string: 6, fret: 0, name: "A4" },
      { time: 7000, string: 7, fret: 0, name: "B4" },
      { time: 8000, string: 8, fret: 0, name: "C5" }
    ]
  },
  {
    title: "Estrellita Dónde Estás (Flauta Dulce)",
    difficulty: "easy",
    bpm: 90,
    instrument: "flute",
    track_data: [
      { time: 0, string: 1, fret: 0, name: "C4" },
      { time: 600, string: 1, fret: 0, name: "C4" },
      { time: 1200, string: 5, fret: 0, name: "G4" },
      { time: 1800, string: 5, fret: 0, name: "G4" },
      { time: 2400, string: 6, fret: 0, name: "A4" },
      { time: 3000, string: 6, fret: 0, name: "A4" },
      { time: 3600, string: 5, fret: 0, name: "G4" },
      
      { time: 4800, string: 4, fret: 0, name: "F4" },
      { time: 5400, string: 4, fret: 0, name: "F4" },
      { time: 6000, string: 3, fret: 0, name: "E4" },
      { time: 6600, string: 3, fret: 0, name: "E4" },
      { time: 7200, string: 2, fret: 0, name: "D4" },
      { time: 7800, string: 2, fret: 0, name: "D4" },
      { time: 8400, string: 1, fret: 0, name: "C4" }
    ]
  },
  {
    title: "Himno a la Alegría (Flauta Dulce)",
    difficulty: "easy",
    bpm: 90,
    instrument: "flute",
    track_data: [
      { time: 0, string: 3, fret: 0, name: "E4" },
      { time: 600, string: 3, fret: 0, name: "E4" },
      { time: 1200, string: 4, fret: 0, name: "F4" },
      { time: 1800, string: 5, fret: 0, name: "G4" },
      { time: 2400, string: 5, fret: 0, name: "G4" },
      { time: 3000, string: 4, fret: 0, name: "F4" },
      { time: 3600, string: 3, fret: 0, name: "E4" },
      { time: 4200, string: 2, fret: 0, name: "D4" },
      { time: 4800, string: 1, fret: 0, name: "C4" },
      { time: 5400, string: 1, fret: 0, name: "C4" },
      { time: 6000, string: 2, fret: 0, name: "D4" },
      { time: 6600, string: 3, fret: 0, name: "E4" },
      { time: 7200, string: 3, fret: 0, name: "E4" },
      { time: 7800, string: 2, fret: 0, name: "D4" },
      { time: 8400, string: 2, fret: 0, name: "D4" }
    ]
  },
  {
    title: "Titanic - My Heart Will Go On (Flauta)",
    difficulty: "medium",
    bpm: 95,
    instrument: "flute",
    track_data: [
      { time: 0, string: 4, fret: 0, name: "F4" },
      { time: 800, string: 5, fret: 0, name: "G4" },
      { time: 1600, string: 6, fret: 0, name: "A4" },
      { time: 2400, string: 5, fret: 0, name: "G4" },
      { time: 3200, string: 4, fret: 0, name: "F4" },
      { time: 4000, string: 5, fret: 0, name: "G4" },
      { time: 4800, string: 8, fret: 0, name: "C5" },
      { time: 5600, string: 6, fret: 0, name: "A4" },
      { time: 6400, string: 5, fret: 0, name: "G4" },
      { time: 7200, string: 4, fret: 0, name: "F4" },
      { time: 8000, string: 2, fret: 0, name: "D4" },
      { time: 8800, string: 1, fret: 0, name: "C4" }
    ]
  }
];

async function seedExpanded() {
  try {
    await sequelize.authenticate();
    console.log('🔗 Conectado a la base de datos MySQL.');
    
    // Sembrar dificultades catálogo si no existen
    const Difficulty = require('./src/models/Difficulty');
    await Difficulty.findOrCreate({ where: { level: 'easy' } });
    await Difficulty.findOrCreate({ where: { level: 'medium' } });
    await Difficulty.findOrCreate({ where: { level: 'hard' } });

    // Sembrar instrumentos catálogo si no existen
    const Instrument = require('./src/models/Instrument');
    await Instrument.findOrCreate({ where: { name: 'ukulele' } });
    await Instrument.findOrCreate({ where: { name: 'guitar_acoustic' } });
    await Instrument.findOrCreate({ where: { name: 'guitar_electric' } });
    await Instrument.findOrCreate({ where: { name: 'violin' } });
    await Instrument.findOrCreate({ where: { name: 'flute' } });
    await Instrument.findOrCreate({ where: { name: 'piano' } });
    
    for (const song of expandedSongs) {
      // Obtener dificultad asignada
      const diffRecord = await Difficulty.findOne({ where: { level: song.difficulty } });
      const difficultyId = diffRecord ? diffRecord.id : null;

      // Evitar duplicados por título e instrumento
      const [level, created] = await Level.findOrCreate({
        where: { title: song.title, instrument: song.instrument },
        defaults: {
          title: song.title,
          instrument: song.instrument,
          bpm: song.bpm,
          track_data: song.track_data,
          difficultyId: difficultyId
        }
      });
      if (created) {
        console.log(`✅ Creada con éxito: "${song.title}" (${song.instrument})`);
      } else {
        console.log(`ℹ️ Ya existe la canción: "${song.title}" (${song.instrument})`);
      }
    }

    console.log('🌱 ¡Sinfonía de instrumentos sembrada con éxito!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error sembrando canciones:', err);
    process.exit(1);
  }
}

seedExpanded();

const { Level, Difficulty } = require('../models');

// FUNCIÓN PARA PEDIR: Obtener todas las canciones (para la lista del menú)
exports.getAllLevels = async (req, res) => {
    try {
        const { instrument } = req.query;
        let where = {};
        if (instrument) {
            where.instrument = instrument;
        }

        const levels = await Level.findAll({
            where: where,
            attributes: ['id', 'title', 'difficultyId', 'bpm', 'instrument'],
            include: [Difficulty]
        });

        // Mapear para responder exactamente con lo esperado (incluyendo el string virtual difficulty)
        const result = levels.map(lvl => ({
            id: lvl.id,
            title: lvl.title,
            difficulty: lvl.difficulty,
            bpm: lvl.bpm,
            instrument: lvl.instrument
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener niveles", error: error.message });
    }
};

// FUNCIÓN PARA MANDAR: Crear una nueva canción (la que usaríamos para la "semilla")
exports.createLevel = async (req, res) => {
    try {
        const { title, difficulty, bpm, track_data } = req.body;
        
        // Buscar la dificultad correspondiente
        const diffRecord = await Difficulty.findOne({ where: { level: difficulty || 'easy' } });
        
        const newLevel = await Level.create({ 
            title, 
            difficultyId: diffRecord ? diffRecord.id : 1, 
            bpm, 
            track_data 
        });
        
        res.status(201).json({ 
            message: "Nivel creado", 
            level: {
                id: newLevel.id,
                title: newLevel.title,
                difficulty: difficulty || 'easy',
                bpm: newLevel.bpm,
                track_data: newLevel.track_data
            } 
        });
    } catch (error) {
        res.status(400).json({ message: "Error al crear nivel", error: error.message });
    }
};

// FUNCIÓN PARA PEDIR: Obtener los detalles de UNA canción específica (para jugar)
exports.getLevelById = async (req, res) => {
    try {
        const level = await Level.findByPk(req.params.id, {
            include: [Difficulty]
        });
        if (!level) return res.status(404).json({ message: "Nivel no encontrado" });
        
        res.json({
            id: level.id,
            title: level.title,
            difficulty: level.difficulty,
            bpm: level.bpm,
            instrument: level.instrument,
            track_data: level.track_data
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el nivel", error: error.message });
    }
};
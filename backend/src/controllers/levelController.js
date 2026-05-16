const Level = require('../models/Level');

// FUNCIÓN PARA PEDIR: Obtener todas las canciones (para la lista del menú)
exports.getAllLevels = async (req, res) => {
    try {
        const levels = await Level.findAll({
            attributes: ['id', 'title', 'difficulty', 'bpm'] // No mandamos el JSON pesado aún
        });
        res.json(levels);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener niveles", error: error.message });
    }
};

// FUNCIÓN PARA MANDAR: Crear una nueva canción (la que usaríamos para la "semilla")
exports.createLevel = async (req, res) => {
    try {
        const { title, difficulty, bpm, track_data } = req.body;
        const newLevel = await Level.create({ title, difficulty, bpm, track_data });
        res.status(201).json({ message: "Nivel creado", level: newLevel });
    } catch (error) {
        res.status(400).json({ message: "Error al crear nivel", error: error.message });
    }
};

// FUNCIÓN PARA PEDIR: Obtener los detalles de UNA canción específica (para jugar)
exports.getLevelById = async (req, res) => {
    try {
        const level = await Level.findByPk(req.params.id);
        if (!level) return res.status(404).json({ message: "Nivel no encontrado" });
        res.json(level);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el nivel", error: error.message });
    }
};
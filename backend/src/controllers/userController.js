const { User, UserInstrument } = require('../models');
const { Op, literal } = require('sequelize');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, bio, profile } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (username) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (profile) user.profile = profile;

        await user.save();

        // Obtener stats por instrumento para el perfil
        const allStats = await UserInstrument.findAll({ where: { userId } });
        const statsMap = {};
        allStats.forEach(s => {
            statsMap[s.instrument] = { xp: s.xp, level: s.level, badges: s.badges };
        });

        res.json({
            message: "Perfil actualizado con éxito",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                xp: user.xp,
                instrumentStats: statsMap,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.imgProfile ? user.imgProfile.toString() : null,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ message: "Error al actualizar el perfil", error: error.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const instrument = req.query.instrument || 'ukulele';

        // Buscar en la tabla UserInstrument y unir con User
        const topInstruments = await UserInstrument.findAll({
            where: { instrument },
            include: [{
                model: User,
                attributes: ['username', 'imgProfile', 'bio']
            }],
            order: [['xp', 'DESC']],
            limit: limit
        });

        const result = topInstruments.map(ui => ({
            id: ui.userId,
            username: ui.User ? ui.User.username : 'Usuario',
            xp: ui.xp,
            level: ui.level,
            bio: ui.User ? ui.User.bio : null,
            profile: ui.User && ui.User.imgProfile ? ui.User.imgProfile.toString() : null
        }));

        res.json(result);
    } catch (error) {
        console.error("Error al obtener leaderboard:", error);
        res.status(500).json({ message: "Error al obtener el ranking", error: error.message });
    }
};

exports.enrollInstrument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { instrument } = req.body;

        if (!instrument) {
            return res.status(400).json({ message: "El instrumento es requerido" });
        }

        const validInstruments = ['ukulele', 'guitar_acoustic', 'guitar_electric', 'violin'];
        if (!validInstruments.includes(instrument)) {
            return res.status(400).json({ message: "Instrumento no válido" });
        }

        const [userInstrument, created] = await UserInstrument.findOrCreate({
            where: { userId, instrument },
            defaults: { xp: 0, level: 1, badges: [] }
        });

        const allStats = await UserInstrument.findAll({ where: { userId } });
        const statsMap = {};
        allStats.forEach(s => {
            statsMap[s.instrument] = { xp: s.xp, level: s.level, badges: s.badges };
        });

        const user = await User.findByPk(userId);
        if (user) {
            user.targetInstrument = instrument;
            await user.save();
        }

        res.json({
            message: created ? "Inscrito con éxito al nuevo instrumento" : "Ya estás inscrito en este instrumento",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                xp: user.xp,
                instrumentStats: statsMap,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.imgProfile ? user.imgProfile.toString() : null,
                bio: user.bio,
                targetInstrument: instrument
            }
        });
    } catch (error) {
        console.error("Error al inscribir instrumento:", error);
        res.status(500).json({ message: "Error al inscribir el instrumento", error: error.message });
    }
};

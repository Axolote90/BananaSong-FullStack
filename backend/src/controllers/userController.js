const User = require('../models/User');
const { Op } = require('sequelize');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, bio, profile } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Actualizar campos si se proporcionan
        if (username) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (profile) user.profile = profile;

        await user.save();

        res.json({
            message: "Perfil actualizado con éxito",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                xp: user.xp,
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

        const topUsers = await User.findAll({
            attributes: ['id', 'username', 'xp', 'imgProfile', 'bio'],
            order: [['xp', 'DESC']],
            limit: limit
        });

        // Mapear para que el frontend reciba 'profile' como string
        const result = topUsers.map(u => ({
            id: u.id,
            username: u.username,
            xp: u.xp,
            bio: u.bio,
            profile: u.imgProfile ? u.imgProfile.toString() : null
        }));

        res.json(result);
    } catch (error) {
        console.error("Error al obtener leaderboard:", error);
        res.status(500).json({ message: "Error al obtener el ranking", error: error.message });
    }
};

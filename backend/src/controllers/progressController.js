const Progress = require('../models/Progress');
const User = require('../models/User');

exports.saveProgress = async (req, res) => {
    try {
        const { levelId, score, stars, maxCombo, accuracy } = req.body;
        const userId = req.user.id; // Viene del token

        // Buscar si ya existe progreso para este usuario y nivel
        let progress = await Progress.findOne({ where: { userId, levelId } });

        if (progress) {
            // Actualizar si el nuevo score es mayor
            if (score > progress.score) {
                progress.score = score;
                progress.stars = stars;
                progress.maxCombo = Math.max(progress.maxCombo, maxCombo);
                progress.accuracy = Math.max(progress.accuracy, accuracy);
                progress.completed = true;
                await progress.save();
            }
        } else {
            // Crear nuevo progreso
            progress = await Progress.create({
                userId,
                levelId,
                score,
                stars,
                completed: true,
                maxCombo,
                accuracy
            });
        }

        // Sumar XP al usuario (por ejemplo, el 10% del score)
        const user = await User.findByPk(userId);
        if (user) {
            const earnedXp = Math.floor(score * 0.1);
            user.xp += earnedXp;
            
            // Lógica simple de racha diaria
            const now = new Date();
            if (!user.lastLoginDate) {
                user.streak = 1;
            } else {
                const diffTime = Math.abs(now - user.lastLoginDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays === 1) {
                    user.streak += 1;
                } else if (diffDays > 1) {
                    user.streak = 1; // Pierde racha
                }
            }
            user.lastLoginDate = now;
            await user.save();
        }

        res.json({
            message: "Progreso guardado con éxito",
            progress,
            userStats: {
                xp: user.xp,
                streak: user.streak,
                hearts: user.hearts
            }
        });

    } catch (error) {
        console.error("Error al guardar progreso:", error);
        res.status(500).json({ message: "Error al guardar el progreso", error: error.message });
    }
};

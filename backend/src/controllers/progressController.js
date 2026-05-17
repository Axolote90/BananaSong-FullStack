const { Progress, User, Level, UserInstrument } = require('../models');

exports.saveProgress = async (req, res) => {
    try {
        const { levelId, score, stars, maxCombo, accuracy } = req.body;
        const userId = req.user.id; 

        const level = await Level.findByPk(levelId);
        if (!level) return res.status(404).json({ message: "Nivel no encontrado" });

        const instrument = level.instrument || 'ukulele';
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // --- DETECTAR SI BATE RÉCORD EN TIEMPO REAL ---
        const previousTopProgress = await Progress.findOne({
            where: { levelId },
            include: [{ model: User, attributes: ['username'] }],
            order: [['score', 'DESC']]
        });

        let isRecordBeaten = false;
        let formerTopUser = null;
        let formerTopUserId = null;

        if (previousTopProgress && previousTopProgress.userId !== userId) {
            if (score > previousTopProgress.score) {
                isRecordBeaten = true;
                formerTopUser = previousTopProgress.User ? previousTopProgress.User.username : 'Otro jugador';
                formerTopUserId = previousTopProgress.userId;
            }
        }

        // Buscar/Actualizar progreso
        let progress = await Progress.findOne({ where: { userId, levelId } });

        if (progress) {
            if (score > progress.score) {
                progress.score = score;
                progress.stars = stars;
                progress.maxCombo = Math.max(progress.maxCombo, maxCombo);
                progress.accuracy = Math.max(progress.accuracy, accuracy);
                progress.completed = true;
                progress.instrument = instrument;
                await progress.save();
            }
        } else {
            progress = await Progress.create({
                userId, levelId, score, stars, completed: true, maxCombo, accuracy, instrument
            });
        }

        // ACTUALIZAR ESTADÍSTICAS INDEPENDIENTES (UserInstrument)
        const [stats, created] = await UserInstrument.findOrCreate({
            where: { userId, instrument },
            defaults: { xp: 0, level: 1, badges: [] }
        });

        const earnedXp = Math.floor(score * 0.1);
        stats.xp += earnedXp;
        
        const oldLevel = stats.level;
        stats.level = Math.floor(stats.xp / 1000) + 1;
        
        if (!stats.badges) stats.badges = [];
        const currentBadges = stats.badges;
        const xp = stats.xp;

        if (xp >= 500 && !currentBadges.includes('novice')) currentBadges.push('novice');
        if (xp >= 1500 && !currentBadges.includes('apprentice')) currentBadges.push('apprentice');
        if (xp >= 4000 && !currentBadges.includes('specialist')) currentBadges.push('specialist');
        if (xp >= 10000 && !currentBadges.includes('master')) currentBadges.push('master');

        stats.changed('badges', true);
        await stats.save();

        // Actualizar Usuario
        user.xp += earnedXp; 
        const now = new Date();
        if (!user.lastLoginDate) {
            user.streak = 1;
        } else {
            const diffTime = Math.abs(now - user.lastLoginDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) user.streak += 1;
            else if (diffDays > 1) user.streak = 1;
        }
        user.lastLoginDate = now;
        await user.save();

        // EMITIR NOTIFICACIONES EN TIEMPO REAL VÍA WEBSOCKETS
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        if (io) {
            // 1. Notificar actualización de Leaderboard en vivo
            io.emit('leaderboard_update', { instrument });

            // 2. Notificar récord batido
            if (isRecordBeaten) {
                // Broadcast a toda la comunidad online
                io.emit('record_beaten_broadcast', {
                    levelTitle: level.title,
                    formerTopUser,
                    newTopUser: user.username,
                    score
                });

                // Alerta específica al rival superado si está online
                if (onlineUsers && onlineUsers.has(Number(formerTopUserId))) {
                    const targetSocketId = onlineUsers.get(Number(formerTopUserId));
                    io.to(targetSocketId).emit('record_beaten_personal', {
                        levelTitle: level.title,
                        newTopUser: user.username,
                        score
                    });
                }
            }
        }

        const allStats = await UserInstrument.findAll({ where: { userId } });
        const statsMap = {};
        allStats.forEach(s => {
            statsMap[s.instrument] = { xp: s.xp, level: s.level, badges: s.badges };
        });

        res.json({
            message: "Progreso guardado con éxito",
            progress,
            userStats: {
                xp: user.xp,
                instrumentStats: statsMap,
                streak: user.streak,
                hearts: user.hearts
            }
        });

    } catch (error) {
        console.error("Error al guardar progreso:", error);
        res.status(500).json({ message: "Error al guardar el progreso", error: error.message });
    }
};

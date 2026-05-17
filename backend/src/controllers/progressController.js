const { Progress, User, Level, UserInstrument } = require('../models');
const { Op } = require('sequelize');

exports.saveProgress = async (req, res) => {
    try {
        const { levelId, score, stars, maxCombo, accuracy } = req.body;
        const userId = req.user.id; 

        const level = await Level.findByPk(levelId);
        if (!level) return res.status(404).json({ message: "Nivel no encontrado" });

        const instrument = level.instrument || 'ukulele';
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

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

        // Obtener XP antes y después del progreso para detectar superaciones en ranking
        const oldXp = stats.xp;
        const earnedXp = Math.floor(score * 0.1);
        stats.xp += earnedXp;
        const newXp = stats.xp;
        
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

        // DETECTAR USUARIOS SUPERADOS EN EL RANKING GENERAL DE ESTE INSTRUMENTO
        const surpassedUsers = await UserInstrument.findAll({
            where: {
                instrument,
                userId: { [Op.ne]: userId }, // Excluir al jugador actual
                xp: {
                    [Op.between]: [oldXp, newXp - 1] // Tenían más (o igual) XP que el oldXp del jugador, pero quedan por debajo de su newXp
                }
            },
            include: [{ model: User, attributes: ['username'] }]
        });

        // EMITIR NOTIFICACIONES EN TIEMPO REAL VÍA WEBSOCKETS
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');

        console.log(`[DEBUG_WS] UserId actual: ${userId} (${user.username}). Instrumento: ${instrument}. XP anterior: ${oldXp} -> XP nueva: ${newXp}`);
        console.log(`[DEBUG_WS] Encontrado io: ${!!io}, Encontrado onlineUsers: ${!!onlineUsers}`);
        if (onlineUsers) {
            console.log(`[DEBUG_WS] Usuarios online en el mapa:`, Array.from(onlineUsers.entries()));
        }

        if (io) {
            // 1. Notificar actualización de Leaderboard en vivo
            io.emit('leaderboard_update', { instrument });
            console.log(`[DEBUG_WS] Emitida actualización de leaderboard para: ${instrument}`);

            // 2. Notificar a cada uno de los rivales que fueron superados en el ranking
            if (surpassedUsers && surpassedUsers.length > 0) {
                console.log(`[DEBUG_WS] ¡Superación en el ranking detectada! Superados: ${surpassedUsers.length}`);
                
                const instrLabel = instrument === 'ukulele' 
                    ? 'Ukelele' 
                    : (instrument === 'guitar_acoustic' ? 'Guitarra Acústica' : (instrument === 'guitar_electric' ? 'Guitarra Eléctrica' : 'Violín'));

                for (const surpassed of surpassedUsers) {
                    const rivalId = String(surpassed.userId);
                    const rivalUsername = surpassed.User ? surpassed.User.username : 'Otro jugador';
                    
                    console.log(`[DEBUG_WS] - Rival superado: ${rivalUsername} (${rivalId}). Rival XP: ${surpassed.xp}`);

                    // Broadcast a toda la comunidad online (general)
                    io.emit('record_beaten_broadcast', {
                        instrumentName: instrLabel,
                        formerTopUser: rivalUsername,
                        newTopUser: user.username,
                        xp: newXp
                    });
                    console.log(`[DEBUG_WS] Emitido record_beaten_broadcast para el rival ${rivalUsername}`);

                    // Alerta específica al rival superado si está online
                    if (onlineUsers && onlineUsers.has(rivalId)) {
                        const targetSocketId = onlineUsers.get(rivalId);
                        io.to(targetSocketId).emit('record_beaten_personal', {
                            instrumentName: instrLabel,
                            newTopUser: user.username,
                            xp: newXp
                        });
                        console.log(`[DEBUG_WS] Emitido record_beaten_personal a ${rivalUsername} en el socket ${targetSocketId}`);
                    } else {
                        console.log(`[DEBUG_WS] Rival ${rivalUsername} (${rivalId}) no está online.`);
                    }
                }
            } else {
                console.log(`[DEBUG_WS] Ningún usuario fue superado en el ranking con este progreso.`);
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

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, UserInstrument, Instrument } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = '24h';

// Helper para generar tokens
const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper para obtener estadísticas mapeadas
const getInstrumentStatsMap = async (userId) => {
    const allStats = await UserInstrument.findAll({ 
        where: { userId },
        include: [Instrument]
    });
    const statsMap = {};
    allStats.forEach(s => {
        statsMap[s.instrument] = { xp: s.xp, level: s.level, badges: s.badges };
    });
    return statsMap;
};

// Helper para regenerar corazones con el tiempo (1 por hora)
const applyHeartRegeneration = async (user) => {
    const MAX_HEARTS = 5;
    const REGEN_TIME_MS = 60 * 60 * 1000; // 1 hora
    
    if (user.hearts < MAX_HEARTS) {
        const now = new Date();
        const lastRegen = user.lastHeartRegenDate ? new Date(user.lastHeartRegenDate) : new Date();
        const diffMs = now - lastRegen;
        
        if (diffMs >= REGEN_TIME_MS || !user.lastHeartRegenDate) {
            const heartsToRegen = Math.floor(diffMs / REGEN_TIME_MS);
            if (user.lastHeartRegenDate) {
                user.hearts = Math.min(MAX_HEARTS, user.hearts + heartsToRegen);
            }
            const remainderMs = diffMs % REGEN_TIME_MS;
            user.lastHeartRegenDate = new Date(now.getTime() - remainderMs);
            await user.save();
        }
    }
    return user;
};

// --- REGISTRO DE USUARIO ---
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: { 
                username, 
                password: await bcrypt.hash(password, 10),
                confirmationToken
            }
        });

        if (!created) return res.status(400).json({ message: "El correo electrónico ya está registrado" });

        const confirmUrl = `${req.protocol}://${req.get('host')}/api/auth/confirm/${confirmationToken}`;
        
        res.status(201).json({ 
            message: "Registro exitoso. Revisa tu correo para confirmar tu cuenta.", 
            user: { id: user.id, username: user.username, email: user.email, instrumentStats: {} },
            token: generateToken(user),
            devConfirmUrl: confirmUrl 
        });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error: error.message });
    }
};

// --- CONFIRMAR CORREO ---
exports.confirmEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ where: { confirmationToken: token } });

        if (!user) return res.status(400).json({ message: "Token de confirmación inválido o expirado" });

        user.isConfirmed = true;
        user.confirmationToken = null;
        await user.save();

        res.json({ message: "Cuenta confirmada con éxito. Ya puedes completar tu perfil." });
    } catch (error) {
        res.status(500).json({ message: "Error al confirmar cuenta", error: error.message });
    }
};

// --- ACTUALIZAR ONBOARDING (INSTRUMENTOS) ---
exports.updateOnboarding = async (req, res) => {
    try {
        const { targetInstrument, knownInstruments, skillLevel } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        user.targetInstrument = targetInstrument;
        user.knownInstruments = knownInstruments;
        user.skillLevel = skillLevel;
        await user.save();

        const statsMap = await getInstrumentStatsMap(user.id);

        res.json({ message: "Preferencias guardadas con éxito", user: { targetInstrument, skillLevel, instrumentStats: statsMap } });
    } catch (error) {
        res.status(500).json({ message: "Error al guardar preferencias", error: error.message });
    }
};

// --- INICIO DE SESIÓN (LOGIN) ---
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        let user = await User.findOne({ where: { username } });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciales incorrectas" });
        }

        user = await applyHeartRegeneration(user);
        const statsMap = await getInstrumentStatsMap(user.id);

        res.json({ 
            message: "Login exitoso", 
            user: {
                id: user.id,
                username: user.username,
                xp: user.xp,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.profile,
                instrumentStats: statsMap
            },
            token: generateToken(user)
        });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error: error.message });
    }
};

// --- OBTENER PERFIL ---
exports.getProfile = async (req, res) => {
    try {
        let user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        user = await applyHeartRegeneration(user);
        const statsMap = await getInstrumentStatsMap(user.id);

        res.json({
            message: "Perfil obtenido con éxito",
            user: {
                id: user.id,
                username: user.username,
                xp: user.xp,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.profile,
                instrumentStats: statsMap
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener perfil", error: error.message });
    }
};
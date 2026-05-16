const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = '24h';

// Helper para generar tokens
const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper para regenerar corazones con el tiempo (1 por hora)
const applyHeartRegeneration = async (user) => {
    const MAX_HEARTS = 5;
    const REGEN_TIME_MS = 60 * 60 * 1000; // 1 hora
    
    if (user.hearts < MAX_HEARTS) {
        const now = new Date();
        // Si no hay fecha de regeneración, usar la fecha actual (o lastLoginDate)
        const lastRegen = user.lastHeartRegenDate ? new Date(user.lastHeartRegenDate) : new Date();
        const diffMs = now - lastRegen;
        
        if (diffMs >= REGEN_TIME_MS || !user.lastHeartRegenDate) {
            const heartsToRegen = Math.floor(diffMs / REGEN_TIME_MS);
            // Si es la primera vez (!lastHeartRegenDate), no sumar corazones pero inicializar fecha
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
        const { username, password } = req.body;
        console.log("Datos recibidos en register:", req.body); // 👈 NUEVO LOG

        const [user, created] = await User.findOrCreate({
            where: { username },
            defaults: { password: await bcrypt.hash(password, 10) }
        });

        if (!created) {
            return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
        }

        res.status(201).json({ 
            message: "Usuario registrado con éxito", 
            user: { id: user.id, username: user.username },
            token: generateToken(user)
        });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error: error.message });
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

        res.json({ 
            message: "Login exitoso", 
            user: {
                id: user.id,
                username: user.username,
                xp: user.xp,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.profile
            },
            token: generateToken(user)
        });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error: error.message });
        console.log("Error en login:", error);
    }
};

// --- OBTENER PERFIL ---
exports.getProfile = async (req, res) => {
    try {
        let user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        user = await applyHeartRegeneration(user);

        res.json({
            message: "Perfil obtenido con éxito",
            user: {
                id: user.id,
                username: user.username,
                xp: user.xp,
                streak: user.streak,
                hearts: user.hearts,
                profile: user.profile
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener perfil", error: error.message });
    }
};
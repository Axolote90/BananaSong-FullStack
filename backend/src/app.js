const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// --- 1. IMPORTACIÓN DE CONEXIÓN Y MODELOS ---
const sequelize = require('./config/db');
const { User, Level, Progress, Difficulty, Instrument } = require('./models');

const levelRoutes = require('./routes/levelRoutes');
const authRoutes = require('./routes/authRoutes');
const progressRoutes = require('./routes/progressRoutes');
const userRoutes = require('./routes/userRoutes');

// --- 2. CONFIGURACIÓN DEL SERVIDOR ---
const app = express();
app.set('trust proxy', 1); // Confiar en proxies inversos como ngrok
const server = http.createServer(app);

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Desactivar CSP estricta que bloquea recursos inline de Angular
}));
app.use(cors()); // Permite peticiones externas (Frontend separado / App Android)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Rate Limiting (Ajustado para testing local y Ngrok)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5000, // Incrementado de 100 a 5000 para evitar bloqueos falsos positivos en Ngrok
    message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.'
});
app.use('/api', globalLimiter); // Aplicar solo a las rutas de API
// --- 3. CONFIGURACIÓN DE WEBSOCKETS (Tiempo Real) ---
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
app.set('io', io);

// Mapa de usuarios online: userId -> socketId
const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers);

// Eventos de Socket.io
io.on('connection', (socket) => {
    console.log(`Cliente conectado al túnel: ${socket.id}`);
    
    // El cliente se identifica al conectarse
    socket.on('identify', (userId) => {
        if (userId) {
            onlineUsers.set(String(userId), socket.id);
            console.log(`👤 Usuario online registrado: UserId ${userId} -> Socket ${socket.id}`);
        }
    });
    
    socket.on('disconnect', () => {
        // Limpiar el mapa
        for (const [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                console.log(`👤 Usuario offline: UserId ${uid}`);
                break;
            }
        }
        console.log('Cliente se ha desconectado');
    });
});

// --- 4. CONFIGURACIÓN DE RELACIONES (SQL Asociaciones) ---
// Las relaciones y llaves foráneas se inicializan y mapean automáticamente al requerir el archivo centralizado `./models`

// --- 5. RUTAS DE LA API ---
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Banana Song API está operativa',
        timestamp: new Date()
    });
});

app.use('/api/levels', levelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/users', userRoutes);

// --- 5.5 SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND (ANGULAR) ---
app.use(express.static(path.join(__dirname, '../../frontend/dist/frontend/browser')));

// Cualquier ruta que no sea de la API redirige al index.html de Angular (SPA Routing)
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/frontend/browser/index.html'));
});

// --- MANEJO DE ERRORES GLOBAL ---
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// --- 6. SINCRONIZACIÓN Y ARRANQUE ---
// Sincronizamos modelos con la DB antes de abrir el puerto
sequelize.sync({ alter: true }) // alter: true aplica los cambios a la db sin borrar datos
    .then(async () => {
        console.log('--------------------------------------------');
        console.log('✅ Tablas sincronizadas con MySQL con éxito.');
        
        // Sembrar Dificultades Catálogo
        const Difficulty = require('./models/Difficulty');
        await Difficulty.findOrCreate({ where: { level: 'easy' } });
        await Difficulty.findOrCreate({ where: { level: 'medium' } });
        await Difficulty.findOrCreate({ where: { level: 'hard' } });

        // Sembrar Instrumentos Catálogo
        const Instrument = require('./models/Instrument');
        await Instrument.findOrCreate({ where: { name: 'ukulele' } });
        await Instrument.findOrCreate({ where: { name: 'guitar_acoustic' } });
        await Instrument.findOrCreate({ where: { name: 'guitar_electric' } });
        await Instrument.findOrCreate({ where: { name: 'violin' } });
        console.log('🌱 Semillas de dificultades e instrumentos cargadas y actualizadas.');
        
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Servidor API corriendo en puerto ${PORT}`);
            console.log('--------------------------------------------');
        });
    })
    .catch(err => {
        console.error('❌ Error crítico al sincronizar la base de datos:');
        console.error(err.message);
        process.exit(1); // Detiene el proceso si no hay DB
    });
const fs = require('fs');
const path = require('path');
const { User, Level, Progress, UserInstrument, Difficulty, Instrument } = require('./src/models');

async function exportToCSV() {
    try {
        console.log('🏁 Iniciando la exportación de la base de datos normalizada de Banana Song...');
        
        const exportDir = path.join(__dirname, 'database_exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir);
        }

        // Helper para convertir array de objetos a texto CSV robusto
        function convertToCSV(data, columns) {
            const header = columns.join(',');
            const rows = data.map(item => {
                return columns.map(col => {
                    let val = item[col];
                    if (val === null || val === undefined) {
                        return '';
                    }
                    if (col === 'badges' || col === 'instrument_badges') {
                        val = JSON.stringify(val);
                    }
                    if (col === 'imgProfile') {
                        return '[BLOB_DATA]';
                    }
                    val = String(val).replace(/"/g, '""'); // Escapar comillas dobles
                    if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                        val = `"${val}"`; // Envolver en comillas si es necesario
                    }
                    return val;
                }).join(',');
            });
            return [header, ...rows].join('\n');
        }

        // --- CARGAR DATOS DESDE MYSQL ---
        console.log('📦 Consultando tablas normalizadas en MySQL...');
        const users = await User.findAll();
        const levels = await Level.findAll({ include: [Difficulty] });
        const progress = await Progress.findAll({ include: [Instrument] });
        const userInstruments = await UserInstrument.findAll({ include: [Instrument] });
        const difficulties = await Difficulty.findAll();
        const instruments = await Instrument.findAll();

        const rawUsers = users.map(u => u.get({ plain: true }));
        const rawLevels = levels.map(l => {
            const plain = l.get({ plain: true });
            plain.difficulty = l.difficulty; // Resuelve el virtual string
            return plain;
        });
        const rawProgress = progress.map(p => {
            const plain = p.get({ plain: true });
            plain.instrument = p.instrument; // Resuelve el virtual string
            return plain;
        });
        const rawUserInstruments = userInstruments.map(ui => {
            const plain = ui.get({ plain: true });
            plain.instrument = ui.instrument; // Resuelve el virtual string
            return plain;
        });
        const rawDifficulties = difficulties.map(d => d.get({ plain: true }));
        const rawInstruments = instruments.map(i => i.get({ plain: true }));

        // =========================================================================
        // 1. GENERAR ARCHIVO CSV ÚNICO (UNIFIED FLAT TABLE)
        // =========================================================================
        console.log('🧩 Creando archivo CSV unificado (denormalizado)...');
        const unifiedRows = [];
        
        const levelsMap = {};
        rawLevels.forEach(l => {
            levelsMap[l.id] = l;
        });

        for (const u of rawUsers) {
            const uInstruments = rawUserInstruments.filter(ui => ui.userId === u.id);
            const uProgress = rawProgress.filter(p => p.userId === u.id);

            if (uInstruments.length > 0 || uProgress.length > 0) {
                if (uProgress.length > 0) {
                    for (const p of uProgress) {
                        const lvl = levelsMap[p.levelId] || {};
                        const instStat = uInstruments.find(ui => ui.instrumentId === p.instrumentId) || {};
                        
                        unifiedRows.push({
                            user_id: u.id,
                            username: u.username,
                            user_email: u.email || '',
                            user_xp: u.xp,
                            user_streak: u.streak,
                            user_hearts: u.hearts,
                            instrument: p.instrument,
                            instrument_xp: instStat.xp || 0,
                            instrument_level: instStat.level || 1,
                            instrument_badges: instStat.badges || [],
                            played_level_title: lvl.title || '',
                            played_level_difficulty: lvl.difficulty || '',
                            played_level_score: p.score,
                            played_level_stars: p.stars,
                            played_level_combo: p.maxCombo,
                            played_level_accuracy: p.accuracy
                        });
                    }
                } else {
                    for (const instStat of uInstruments) {
                        unifiedRows.push({
                            user_id: u.id,
                            username: u.username,
                            user_email: u.email || '',
                            user_xp: u.xp,
                            user_streak: u.streak,
                            user_hearts: u.hearts,
                            instrument: instStat.instrument,
                            instrument_xp: instStat.xp,
                            instrument_level: instStat.level,
                            instrument_badges: instStat.badges || [],
                            played_level_title: '',
                            played_level_difficulty: '',
                            played_level_score: '',
                            played_level_stars: '',
                            played_level_combo: '',
                            played_level_accuracy: ''
                        });
                    }
                }
            } else {
                unifiedRows.push({
                    user_id: u.id,
                    username: u.username,
                    user_email: u.email || '',
                    user_xp: u.xp,
                    user_streak: u.streak,
                    user_hearts: u.hearts,
                    instrument: '',
                    instrument_xp: '',
                    instrument_level: '',
                    instrument_badges: [],
                    played_level_title: '',
                    played_level_difficulty: '',
                    played_level_score: '',
                    played_level_stars: '',
                    played_level_combo: '',
                    played_level_accuracy: ''
                });
            }
        }

        const unifiedCols = [
            'user_id', 'username', 'user_email', 'user_xp', 'user_streak', 'user_hearts',
            'instrument', 'instrument_xp', 'instrument_level', 'instrument_badges',
            'played_level_title', 'played_level_difficulty', 'played_level_score',
            'played_level_stars', 'played_level_combo', 'played_level_accuracy'
        ];
        const unifiedCsv = convertToCSV(unifiedRows, unifiedCols);
        fs.writeFileSync(path.join(exportDir, 'unified_database.csv'), unifiedCsv, 'utf8');
        console.log(`✅ CSV Unificado generado con éxito en database_exports/unified_database.csv (${unifiedRows.length} registros combinados)`);

        // =========================================================================
        // 2. GENERAR DUMP DE BASE DE DATOS COMPATIBLE CON POSTGRESQL (.sql)
        // =========================================================================
        console.log('⚡ Creando Script de Dump SQL de PostgreSQL (postgres_dump.sql)...');
        let sql = `-- =========================================================================\n`;
        sql += `-- DUMP DE BASE DE DATOS BANANA SONG COMPATIBLE CON POSTGRESQL (ESQUEMA NORMALIZADO)\n`;
        sql += `-- Generado automáticamente para subida e integración en IAs de Postgres\n`;
        sql += `-- Fecha de generación: ${new Date().toISOString()}\n`;
        sql += `-- =========================================================================\n\n`;

        // Crear tablas con tipos exactos de Postgres
        sql += `CREATE TABLE IF NOT EXISTS users (\n`;
        sql += `    id UUID PRIMARY KEY,\n`;
        sql += `    username VARCHAR(255) UNIQUE NOT NULL,\n`;
        sql += `    bio VARCHAR(255),\n`;
        sql += `    xp INTEGER DEFAULT 0,\n`;
        sql += `    streak INTEGER DEFAULT 0,\n`;
        sql += `    hearts INTEGER DEFAULT 5,\n`;
        sql += `    email VARCHAR(255) UNIQUE,\n`;
        sql += `    is_confirmed BOOLEAN DEFAULT FALSE,\n`;
        sql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
        sql += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
        sql += `);\n\n`;

        sql += `CREATE TABLE IF NOT EXISTS difficulties (\n`;
        sql += `    id SERIAL PRIMARY KEY,\n`;
        sql += `    level VARCHAR(255) UNIQUE NOT NULL\n`;
        sql += `);\n\n`;

        sql += `CREATE TABLE IF NOT EXISTS instruments (\n`;
        sql += `    id SERIAL PRIMARY KEY,\n`;
        sql += `    name VARCHAR(255) UNIQUE NOT NULL\n`;
        sql += `);\n\n`;

        sql += `CREATE TABLE IF NOT EXISTS levels (\n`;
        sql += `    id SERIAL PRIMARY KEY,\n`;
        sql += `    title VARCHAR(255) NOT NULL,\n`;
        sql += `    notes TEXT,\n`;
        sql += `    stars INTEGER DEFAULT 0,\n`;
        sql += `    instrument VARCHAR(255) DEFAULT 'ukulele',\n`;
        sql += `    difficulty_id INTEGER REFERENCES difficulties(id) ON DELETE SET NULL,\n`;
        sql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
        sql += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
        sql += `);\n\n`;

        sql += `CREATE TABLE IF NOT EXISTS user_instruments (\n`;
        sql += `    id SERIAL PRIMARY KEY,\n`;
        sql += `    xp INTEGER DEFAULT 0,\n`;
        sql += `    level INTEGER DEFAULT 1,\n`;
        sql += `    badges TEXT,\n`;
        sql += `    user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n`;
        sql += `    instrument_id INTEGER REFERENCES instruments(id) ON DELETE CASCADE,\n`;
        sql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
        sql += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
        sql += `);\n\n`;

        sql += `CREATE TABLE IF NOT EXISTS progress (\n`;
        sql += `    id SERIAL PRIMARY KEY,\n`;
        sql += `    score INTEGER DEFAULT 0,\n`;
        sql += `    stars INTEGER DEFAULT 0,\n`;
        sql += `    completed BOOLEAN DEFAULT FALSE,\n`;
        sql += `    max_combo INTEGER DEFAULT 0,\n`;
        sql += `    accuracy FLOAT DEFAULT 0.0,\n`;
        sql += `    user_id UUID REFERENCES users(id) ON DELETE CASCADE,\n`;
        sql += `    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,\n`;
        sql += `    instrument_id INTEGER REFERENCES instruments(id) ON DELETE SET NULL,\n`;
        sql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n`;
        sql += `    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n`;
        sql += `);\n\n`;

        // Insertar datos de Usuarios
        sql += `-- --- DATOS DE USUARIOS ---\n`;
        rawUsers.forEach(u => {
            const bioVal = u.bio ? `'${u.bio.replace(/'/g, "''")}'` : 'NULL';
            const emailVal = u.email ? `'${u.email.replace(/'/g, "''")}'` : 'NULL';
            const cDate = u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt);
            const uDate = u.updatedAt instanceof Date ? u.updatedAt.toISOString() : String(u.updatedAt);
            sql += `INSERT INTO users (id, username, bio, xp, streak, hearts, email, is_confirmed, created_at, updated_at) VALUES ('${u.id}', '${u.username.replace(/'/g, "''")}', ${bioVal}, ${u.xp}, ${u.streak}, ${u.hearts}, ${emailVal}, ${u.isConfirmed ? 'TRUE' : 'FALSE'}, '${cDate}', '${uDate}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Insertar datos de Dificultades
        sql += `-- --- DATOS DE DIFICULTADES ---\n`;
        rawDifficulties.forEach(d => {
            sql += `INSERT INTO difficulties (id, level) VALUES (${d.id}, '${d.level}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Insertar datos de Instrumentos
        sql += `-- --- DATOS DE INSTRUMENTOS ---\n`;
        rawInstruments.forEach(i => {
            sql += `INSERT INTO instruments (id, name) VALUES (${i.id}, '${i.name}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Insertar datos de Niveles
        sql += `-- --- DATOS DE NIVELES ---\n`;
        rawLevels.forEach(l => {
            const notesVal = l.notes ? `'${l.notes.replace(/'/g, "''")}'` : 'NULL';
            const cDate = l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt);
            const uDate = l.updatedAt instanceof Date ? l.updatedAt.toISOString() : String(l.updatedAt);
            sql += `INSERT INTO levels (id, title, notes, stars, instrument, difficulty_id, created_at, updated_at) VALUES (${l.id}, '${l.title.replace(/'/g, "''")}', ${notesVal}, ${l.stars || 0}, '${l.instrument}', ${l.difficultyId || 'NULL'}, '${cDate}', '${uDate}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Insertar datos de UserInstruments
        sql += `-- --- DATOS DE ESTADÍSTICAS POR INSTRUMENTO ---\n`;
        rawUserInstruments.forEach(ui => {
            const badgesVal = ui.badges ? `'${JSON.stringify(ui.badges).replace(/'/g, "''")}'` : `'[]'`;
            const cDate = ui.createdAt instanceof Date ? ui.createdAt.toISOString() : String(ui.createdAt);
            const uDate = ui.updatedAt instanceof Date ? ui.updatedAt.toISOString() : String(ui.updatedAt);
            sql += `INSERT INTO user_instruments (id, xp, level, badges, user_id, instrument_id, created_at, updated_at) VALUES (${ui.id}, ${ui.xp}, ${ui.level}, ${badgesVal}, '${ui.userId}', ${ui.instrumentId || 'NULL'}, '${cDate}', '${uDate}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Insertar datos de Progreso
        sql += `-- --- DATOS DE PROGRESO DE NIVELES ---\n`;
        rawProgress.forEach(p => {
            const cDate = p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt);
            const uDate = p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt);
            sql += `INSERT INTO progress (id, score, stars, completed, max_combo, accuracy, user_id, level_id, instrument_id, created_at, updated_at) VALUES (${p.id}, ${p.score}, ${p.stars}, ${p.completed ? 'TRUE' : 'FALSE'}, ${p.maxCombo}, ${p.accuracy}, '${p.userId}', ${p.levelId}, ${p.instrumentId || 'NULL'}, '${cDate}', '${uDate}') ON CONFLICT (id) DO NOTHING;\n`;
        });
        sql += `\n`;

        // Ajustar secuencias seriales (Postgres increment reset)
        sql += `-- --- RESETEAR SECUENCIAS PARA SERIALES ---\n`;
        sql += `SELECT setval('difficulties_id_seq', COALESCE((SELECT MAX(id)+1 FROM difficulties), 1), false);\n`;
        sql += `SELECT setval('instruments_id_seq', COALESCE((SELECT MAX(id)+1 FROM instruments), 1), false);\n`;
        sql += `SELECT setval('levels_id_seq', COALESCE((SELECT MAX(id)+1 FROM levels), 1), false);\n`;
        sql += `SELECT setval('user_instruments_id_seq', COALESCE((SELECT MAX(id)+1 FROM user_instruments), 1), false);\n`;
        sql += `SELECT setval('progress_id_seq', COALESCE((SELECT MAX(id)+1 FROM progress), 1), false);\n`;

        fs.writeFileSync(path.join(exportDir, 'postgres_dump.sql'), sql, 'utf8');
        console.log(`✅ Dump completo de Postgres generado con éxito en database_exports/postgres_dump.sql`);

        // =========================================================================
        // 3. EXPORTACIONES INDIVIDUALES (Por tablas)
        // =========================================================================
        console.log('💾 Creando CSVs individuales por tabla...');
        
        // Users
        const userCols = ['id', 'username', 'bio', 'xp', 'streak', 'hearts', 'email', 'isConfirmed', 'createdAt', 'updatedAt'];
        const usersCsv = convertToCSV(rawUsers, userCols);
        fs.writeFileSync(path.join(exportDir, 'users.csv'), usersCsv, 'utf8');

        // Levels
        const levelCols = ['id', 'title', 'difficultyId', 'difficulty', 'stars', 'instrument', 'createdAt', 'updatedAt'];
        const levelsCsv = convertToCSV(rawLevels, levelCols);
        fs.writeFileSync(path.join(exportDir, 'levels.csv'), levelsCsv, 'utf8');

        // Progress
        const progressCols = ['id', 'score', 'stars', 'completed', 'maxCombo', 'accuracy', 'instrumentId', 'instrument', 'userId', 'levelId', 'createdAt', 'updatedAt'];
        const progressCsv = convertToCSV(rawProgress, progressCols);
        fs.writeFileSync(path.join(exportDir, 'progress.csv'), progressCsv, 'utf8');

        // UserInstruments
        const instCols = ['id', 'instrumentId', 'instrument', 'xp', 'level', 'badges', 'userId', 'createdAt', 'updatedAt'];
        const instCsv = convertToCSV(rawUserInstruments, instCols);
        fs.writeFileSync(path.join(exportDir, 'user_instruments.csv'), instCsv, 'utf8');

        // Difficulties
        const diffCols = ['id', 'level'];
        const diffCsv = convertToCSV(rawDifficulties, diffCols);
        fs.writeFileSync(path.join(exportDir, 'difficulties.csv'), diffCsv, 'utf8');

        // Instruments
        const instrCols = ['id', 'name'];
        const instrCsv = convertToCSV(rawInstruments, instrCols);
        fs.writeFileSync(path.join(exportDir, 'instruments.csv'), instrCsv, 'utf8');

        console.log('🎉 ¡Proceso terminado! Todos los archivos CSV y SQL están en backend/database_exports/.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al exportar la base de datos:', error);
        process.exit(1);
    }
}

exportToCSV();

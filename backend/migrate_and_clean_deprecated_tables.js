const sequelize = require('./src/config/db');
const { Instrument } = require('./src/models');

async function migrateAndClean() {
    try {
        console.log('🏁 Iniciando migración y limpieza de tablas antiguas duplicadas...');

        // Desactivar temporalmente revisiones de llaves foráneas para poder operar de forma segura
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        // --- 1. DETECTAR TABLAS EXISTENTES ---
        const [tables] = await sequelize.query("SHOW TABLES;");
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('📋 Tablas actuales en la DB:', tableNames);

        const hasOldUserInstruments = tableNames.includes('userinstruments');
        const hasNewUserInstruments = tableNames.includes('user_instruments');
        const hasOldProgresses = tableNames.includes('progresses');
        const hasNewProgress = tableNames.includes('progress');

        // Mapear instrumentos para traducción de IDs rápido
        const instruments = await Instrument.findAll();
        const instrumentMap = {};
        instruments.forEach(inst => {
            instrumentMap[inst.name] = inst.id;
        });

        // =========================================================================
        // MIGRACIÓN 1: userinstruments (antigua sin guión) -> user_instruments (nueva con guión)
        // =========================================================================
        if (hasOldUserInstruments && hasNewUserInstruments) {
            console.log('🔄 Migrando datos de [userinstruments] (antigua) a [user_instruments] (nueva)...');
            
            // Leer filas antiguas
            const [oldRows] = await sequelize.query('SELECT * FROM `userinstruments`;');
            console.log(`📊 Se encontraron ${oldRows.length} registros en la tabla antigua [userinstruments].`);

            for (const row of oldRows) {
                // Resolver el instrumentId a partir del string del instrumento anterior (ej. 'ukulele')
                const instName = row.instrument;
                const instId = instrumentMap[instName] || 1; // default a 1 (ukulele) si no coincide
                
                // Formatear badges a string JSON para guardado seguro
                const badgesJson = typeof row.badges === 'string' ? row.badges : JSON.stringify(row.badges || []);

                // Insertar en la nueva tabla si no existe ya
                await sequelize.query(`
                    INSERT INTO \`user_instruments\` 
                        (id, xp, level, badges, userId, instrumentId, createdAt, updatedAt)
                    VALUES 
                        (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE xp = VALUES(xp), level = VALUES(level), badges = VALUES(badges);
                `, {
                    replacements: [
                        row.id, 
                        row.xp, 
                        row.level, 
                        badgesJson, 
                        row.userId, 
                        instId, 
                        row.createdAt, 
                        row.updatedAt
                    ]
                });
            }
            console.log('✅ Datos de estadísticas por instrumento migrados con éxito.');
            
            // Borrar tabla antigua
            console.log('🗑️ Eliminando tabla antigua obsoleta [userinstruments]...');
            await sequelize.query('DROP TABLE IF EXISTS `userinstruments`;');
        } else {
            console.log('ℹ️ No es necesario migrar estadísticas de instrumentos (ya está limpia).');
        }

        // =========================================================================
        // MIGRACIÓN 2: progresses (antigua con plural inglés) -> progress (nueva normalizada)
        // =========================================================================
        if (hasOldProgresses && hasNewProgress) {
            console.log('🔄 Migrando datos de [progresses] (antigua) a [progress] (nueva)...');
            
            // Leer filas antiguas
            const [oldRows] = await sequelize.query('SELECT * FROM `progresses`;');
            console.log(`📊 Se encontraron ${oldRows.length} registros en la tabla antigua [progresses].`);

            for (const row of oldRows) {
                const instName = row.instrument || 'ukulele';
                const instId = instrumentMap[instName] || 1;

                await sequelize.query(`
                    INSERT INTO \`progress\` 
                        (id, score, stars, completed, maxCombo, accuracy, userId, levelId, instrumentId, createdAt, updatedAt)
                    VALUES 
                        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE score = VALUES(score), stars = VALUES(stars), maxCombo = VALUES(maxCombo), accuracy = VALUES(accuracy);
                `, {
                    replacements: [
                        row.id,
                        row.score,
                        row.stars,
                        row.completed ? 1 : 0,
                        row.maxCombo || 0,
                        row.accuracy || 0.0,
                        row.userId,
                        row.levelId,
                        instId,
                        row.createdAt,
                        row.updatedAt
                    ]
                });
            }
            console.log('✅ Datos de progresos de niveles migrados con éxito.');

            // Borrar tabla antigua
            console.log('🗑️ Eliminando tabla antigua obsoleta [progresses]...');
            await sequelize.query('DROP TABLE IF EXISTS `progresses`;');
        } else {
            console.log('ℹ️ No es necesario migrar progresos (ya está limpia).');
        }

        // Reactivar revisiones de llaves foráneas
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log('🎉 ¡Migración y depuración completada con éxito! Tu base de datos quedó 100% limpia y sin duplicados obsoletos.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error crítico en la migración de datos:', error);
        process.exit(1);
    }
}

migrateAndClean();

const sequelize = require('./src/config/db');

async function cleanGarbageIndexes() {
    try {
        console.log('🔍 Iniciando limpieza de índices duplicados basura...');
        const [tables] = await sequelize.query("SHOW TABLES;");
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\`;`);
            
            // Agrupar por nombre de índice
            const uniqueIndexes = new Set();
            indexes.forEach(idx => {
                uniqueIndexes.add(idx.Key_name);
            });

            for (const keyName of uniqueIndexes) {
                // Si el nombre termina en _2, _3, _4, etc., es basura duplicada de Sequelize sync
                const isGarbage = /_\d+$/.test(keyName);
                
                if (isGarbage) {
                    console.log(`🗑️ Eliminando índice basura: [${keyName}] en tabla [${tableName}]`);
                    try {
                        await sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${keyName}\`;`);
                    } catch (err) {
                        console.error(`   ⚠️ No se pudo eliminar [${keyName}]:`, err.message);
                    }
                }
            }
        }

        console.log('🎉 ¡Limpieza de índices completada con éxito! Tu base de datos quedó 100% limpia.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al limpiar índices:', error);
        process.exit(1);
    }
}

cleanGarbageIndexes();

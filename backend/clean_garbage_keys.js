const sequelize = require('./src/config/db');

async function cleanGarbageKeys() {
    try {
        console.log('🔍 Iniciando escaneo de llaves foráneas basura...');
        
        // Obtener todas las restricciones de llaves foráneas activas en la base de datos
        const [constraints] = await sequelize.query(`
            SELECT 
                TABLE_NAME, 
                CONSTRAINT_NAME, 
                COLUMN_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM 
                information_schema.KEY_COLUMN_USAGE
            WHERE 
                TABLE_SCHEMA = DATABASE() 
                AND REFERENCED_TABLE_NAME IS NOT NULL;
        `);

        console.log(`📊 Se encontraron ${constraints.length} llaves foráneas en total.`);

        // Agrupar relaciones para detectar duplicados
        // Clave: TablaOrigen.ColumnaOrigen -> TablaDestino.ColumnaDestino
        const relationshipMap = {};
        const toDrop = [];

        constraints.forEach(c => {
            const relKey = `${c.TABLE_NAME}.${c.COLUMN_NAME} => ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`;
            
            if (!relationshipMap[relKey]) {
                // Es la primera (la original que mantendremos)
                relationshipMap[relKey] = c.CONSTRAINT_NAME;
            } else {
                // Es un duplicado basura acumulado por Sequelize sync
                toDrop.push({
                    table: c.TABLE_NAME,
                    constraint: c.CONSTRAINT_NAME,
                    relation: relKey
                });
            }
        });

        if (toDrop.length === 0) {
            console.log('✨ ¡Felicidades! No se encontraron llaves foráneas duplicadas o basura en tu base de datos.');
            process.exit(0);
        }

        console.log(`⚠️ Se detectaron ${toDrop.length} restricciones duplicadas que saturan tu diagrama.`);
        
        // Desactivar temporalmente revisiones de llaves foráneas para borrar de forma segura
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

        for (const drop of toDrop) {
            console.log(`🗑️ Eliminando llave basura: [${drop.constraint}] en tabla [${drop.table}] (${drop.relation})`);
            await sequelize.query(`ALTER TABLE \`${drop.table}\` DROP FOREIGN KEY \`${drop.constraint}\`;`);
        }

        // Reactivar revisiones
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log('🎉 ¡Limpieza terminada con éxito! Tu diagrama de base de datos ahora se verá limpio, profesional y minimalista.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al limpiar llaves foráneas:', error);
        process.exit(1);
    }
}

cleanGarbageKeys();

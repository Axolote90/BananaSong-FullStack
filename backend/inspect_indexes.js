const sequelize = require('./src/config/db');

async function inspectIndexes() {
    try {
        console.log('🔍 Inspeccionando índices en la base de datos...');
        const [tables] = await sequelize.query("SHOW TABLES;");
        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const tableName of tableNames) {
            const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\`;`);
            console.log(`\n📊 Tabla [${tableName}] tiene ${indexes.length} índices:`);
            const seen = {};
            indexes.forEach(idx => {
                if (!seen[idx.Key_name]) {
                    seen[idx.Key_name] = [];
                }
                seen[idx.Key_name].push(idx.Column_name);
            });
            Object.keys(seen).forEach(keyName => {
                console.log(`   - Restricción/Índice: [${keyName}] sobre columnas: (${seen[keyName].join(', ')})`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al inspeccionar índices:', error);
        process.exit(1);
    }
}

inspectIndexes();

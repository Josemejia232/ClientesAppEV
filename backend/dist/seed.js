"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const seed_data_1 = require("./seed-data");
async function seed() {
    console.log('🌱 Iniciando seed de datos...');
    await (0, database_1.initDb)();
    await (0, seed_data_1.runSeed)();
    (0, database_1.persistDb)();
    console.log('🎉 Seed completado exitosamente.');
    (0, database_1.closeDb)();
}
seed().catch((err) => {
    console.error('❌ Error durante el seed:', err.message);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map
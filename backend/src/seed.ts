import { initDb, persistDb, closeDb } from './database';
import { runSeed } from './seed-data';

async function seed(): Promise<void> {
  console.log('🌱 Iniciando seed de datos...');
  await initDb();
  await runSeed();
  persistDb();
  console.log('🎉 Seed completado exitosamente.');
  closeDb();
}

seed().catch((err) => {
  console.error('❌ Error durante el seed:', err.message);
  process.exit(1);
});

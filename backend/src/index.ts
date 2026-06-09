import { app, initDb } from './app';

const PORT = process.env.PORT || 3004;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 API de clientes disponible en http://localhost:${PORT}/api`);
  });
}).catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import { initDb, persistDb } from './database';
import clientsRouter from './routes/clients';
import notesRouter from './routes/notes';
import programacionesRouter from './routes/programaciones';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const originalEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      try { persistDb(); } catch (_) {}
    }
    return originalEnd(...args as any);
  };
  next();
});

app.use('/api/clients', clientsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/programaciones', programacionesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 API de clientes disponible en http://localhost:${PORT}/api`);
  });
}).catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err);
  process.exit(1);
});

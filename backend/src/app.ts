import express from 'express';
import cors from 'cors';
import { initDb, persistDb } from './database';
import clientsRouter from './routes/clients';
import notesRouter from './routes/notes';
import programacionesRouter from './routes/programaciones';

const app = express();

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

app.use('/clients', clientsRouter);
app.use('/notes', notesRouter);
app.use('/programaciones', programacionesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export { app, initDb };

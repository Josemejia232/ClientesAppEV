import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

router.get('/client/:clientId', (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM notas WHERE client_id = ? ORDER BY fecha DESC'
  ).all(req.params.clientId);
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { client_id, contenido, tipo, created_by } = req.body;

  if (!client_id || !contenido) {
    res.status(400).json({ error: 'Cliente y contenido son obligatorios' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO notas (client_id, contenido, tipo, created_by)
    VALUES (?, ?, ?, ?)
  `).run(client_id, contenido, tipo || 'Otro', created_by || 'Sistema');

  db.prepare("UPDATE clients SET updated_at = datetime('now', 'localtime'), ultimo_contacto = datetime('now', 'localtime') WHERE id = ?")
    .run(client_id);

  const note = db.prepare('SELECT * FROM notas WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notas WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Nota no encontrada' });
    return;
  }
  db.prepare('DELETE FROM notas WHERE id = ?').run(req.params.id);
  res.json({ message: 'Nota eliminada correctamente' });
});

export default router;

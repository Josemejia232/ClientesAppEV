import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    estado,
    tipo,
    prioridad,
    client_id,
    desde,
    hasta,
    page = '1',
    limit = '50',
  } = req.query;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (estado) { where += ' AND p.estado = ?'; params.push(estado); }
  if (tipo) { where += ' AND p.tipo = ?'; params.push(tipo); }
  if (prioridad) { where += ' AND p.prioridad = ?'; params.push(prioridad); }
  if (client_id) { where += ' AND p.client_id = ?'; params.push(client_id); }
  if (desde) { where += ' AND p.fecha_programada >= ?'; params.push(desde); }
  if (hasta) { where += ' AND p.fecha_programada <= ?'; params.push(hasta); }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM programaciones p ${where}`).get(...params) as any;
  const total = countRow.total;

  const rows = db.prepare(`
    SELECT p.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
           c.telefono1 as cliente_telefono
    FROM programaciones p
    LEFT JOIN clients c ON c.id = p.client_id
    ${where}
    ORDER BY p.fecha_programada ASC, p.hora_programada ASC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset);

  res.json({
    data: rows,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get('/proximas', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT p.*, c.nombre as cliente_nombre
    FROM programaciones p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.estado = 'Pendiente' AND p.fecha_programada >= date('now')
    ORDER BY p.fecha_programada ASC, p.hora_programada ASC
    LIMIT 10
  `).all();
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT p.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion,
           c.telefono1 as cliente_telefono, c.nombre_contacto
    FROM programaciones p
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!row) { res.status(404).json({ error: 'Programación no encontrada' }); return; }
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { client_id, titulo, descripcion, tipo, fecha_programada, hora_programada, duracion_estimada, prioridad, created_by } = req.body;

  if (!client_id || !titulo || !fecha_programada) {
    res.status(400).json({ error: 'Cliente, título y fecha son obligatorios' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO programaciones (client_id, titulo, descripcion, tipo, fecha_programada, hora_programada, duracion_estimada, prioridad, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client_id, titulo, descripcion || '', tipo || 'Llamada', fecha_programada, hora_programada || '09:00', duracion_estimada || 30, prioridad || 'Media', created_by || 'Sistema');

  const row = db.prepare('SELECT * FROM programaciones WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM programaciones WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Programación no encontrada' }); return; }

  const fields = ['titulo', 'descripcion', 'tipo', 'fecha_programada', 'hora_programada', 'duracion_estimada', 'estado', 'prioridad'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (setClauses.length === 0) { res.status(400).json({ error: 'No hay campos para actualizar' }); return; }

  setClauses.push("updated_at = datetime('now', 'localtime')");
  values.push(req.params.id);

  db.prepare(`UPDATE programaciones SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  if (req.body.estado === 'Completada') {
    db.prepare("UPDATE clients SET ultimo_contacto = date('now'), updated_at = datetime('now') WHERE id = ?")
      .run((existing as any).client_id);
  }

  const updated = db.prepare('SELECT * FROM programaciones WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM programaciones WHERE id = ?').get(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Programación no encontrada' }); return; }
  db.prepare('DELETE FROM programaciones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Programación eliminada correctamente' });
});

export default router;

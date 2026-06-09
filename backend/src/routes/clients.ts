import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    search,
    estado,
    categoria,
    vendedor,
    ciudad,
    page = '1',
    limit = '20',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const allowedSortFields = ['nombre', 'identificacion', 'created_at', 'updated_at', 'anio_apertura', 'ciudad', 'estado'];
  const field = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : 'created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (search) {
    where += ` AND (nombre LIKE ? OR identificacion LIKE ? OR nombre_contacto LIKE ? OR telefono1 LIKE ? OR email LIKE ? OR ciudad LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s, s, s);
  }
  if (estado) {
    where += ` AND estado = ?`;
    params.push(estado);
  }
  if (categoria) {
    where += ` AND categoria = ?`;
    params.push(categoria);
  }
  if (vendedor) {
    where += ` AND vendedor LIKE ?`;
    params.push(`%${vendedor}%`);
  }
  if (ciudad) {
    where += ` AND ciudad LIKE ?`;
    params.push(`%${ciudad}%`);
  }

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
  const offset = (pageNum - 1) * limitNum;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM clients ${where}`).get(...params) as any;
  const total = countRow.total;

  const rows = db.prepare(
    `SELECT * FROM clients ${where} ORDER BY ${field} ${order} LIMIT ? OFFSET ?`
  ).all(...params, limitNum, offset);

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalClientes = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as any).count;
  const activos = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE estado = 'Activo'").get() as any).count;
  const inactivos = (db.prepare("SELECT COUNT(*) as count FROM clients WHERE estado = 'Inactivo'").get() as any).count;

  const categorias = db.prepare(
    'SELECT categoria, COUNT(*) as count FROM clients WHERE categoria != "" GROUP BY categoria ORDER BY count DESC'
  ).all();

  const ciudades = db.prepare(
    'SELECT ciudad, COUNT(*) as count FROM clients WHERE ciudad != "" GROUP BY ciudad ORDER BY count DESC LIMIT 10'
  ).all();

  const vendedores = db.prepare(
    'SELECT vendedor, COUNT(*) as count FROM clients WHERE vendedor != "" GROUP BY vendedor ORDER BY count DESC LIMIT 10'
  ).all();

  const aperturaPorAnio = db.prepare(
    'SELECT anio_apertura, COUNT(*) as count FROM clients WHERE anio_apertura IS NOT NULL GROUP BY anio_apertura ORDER BY anio_apertura'
  ).all();

  const clientesAtrasados = db.prepare(`
    SELECT id, nombre, identificacion, proximo_contacto, ultimo_contacto,
           CASE
             WHEN proximo_contacto IS NOT NULL AND proximo_contacto != '' THEN julianday('now') - julianday(proximo_contacto)
             ELSE julianday('now') - julianday(ultimo_contacto)
           END as dias_atraso
    FROM clients
    WHERE estado = 'Activo'
      AND (
        (proximo_contacto IS NOT NULL AND proximo_contacto != '' AND proximo_contacto < date('now'))
        OR
        (ultimo_contacto IS NOT NULL AND ultimo_contacto != '' AND julianday('now') - julianday(ultimo_contacto) > 90 AND (proximo_contacto IS NULL OR proximo_contacto = ''))
      )
    ORDER BY dias_atraso DESC
    LIMIT 10
  `).all();

  const proximosContactos = db.prepare(
    "SELECT id, nombre, proximo_contacto FROM clients WHERE proximo_contacto IS NOT NULL AND proximo_contacto != '' ORDER BY proximo_contacto ASC LIMIT 5"
  ).all();

  res.json({
    totalClientes,
    activos,
    inactivos,
    categorias,
    ciudades,
    vendedores,
    aperturaPorAnio,
    clientesAtrasados,
    proximosContactos
  });
});

router.get('/vendedores', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT DISTINCT vendedor FROM clients WHERE vendedor != "" ORDER BY vendedor'
  ).all();
  res.json(rows.map((r: any) => r.vendedor));
});

router.get('/categorias', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT DISTINCT categoria FROM clients WHERE categoria != "" ORDER BY categoria'
  ).all();
  res.json(rows.map((r: any) => r.categoria));
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Cliente no encontrado' });
    return;
  }
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    identificacion, tipo_identificacion, nombre, nombre_comercial, nombre_contacto,
    direccion, ciudad, departamento, pais, telefono1, telefono2, email,
    contacto_facturacion, email_facturacion, anio_apertura, tipo_persona,
    estado, vendedor, categoria, cupo_credito, observaciones,
    fecha_registro, ultimo_contacto, proximo_contacto
  } = req.body;

  if (!identificacion || !nombre) {
    res.status(400).json({ error: 'Identificación y nombre son obligatorios' });
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO clients (
        identificacion, tipo_identificacion, nombre, nombre_comercial, nombre_contacto,
        direccion, ciudad, departamento, pais, telefono1, telefono2, email,
        contacto_facturacion, email_facturacion, anio_apertura, tipo_persona,
        estado, vendedor, categoria, cupo_credito, observaciones,
        fecha_registro, ultimo_contacto, proximo_contacto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      identificacion, tipo_identificacion || 'NIT', nombre, nombre_comercial || '', nombre_contacto || '',
      direccion || '', ciudad || '', departamento || '', pais || 'Colombia', telefono1 || '', telefono2 || '', email || '',
      contacto_facturacion || '', email_facturacion || '', anio_apertura || null, tipo_persona || 'Natural',
      estado || 'Activo', vendedor || '', categoria || '', cupo_credito || 0, observaciones || '',
      fecha_registro || null, ultimo_contacto || null, proximo_contacto || null
    );

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(client);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Ya existe un cliente con esa identificación' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cliente no encontrado' });
    return;
  }

  const fields = [
    'identificacion', 'tipo_identificacion', 'nombre', 'nombre_comercial', 'nombre_contacto',
    'direccion', 'ciudad', 'departamento', 'pais', 'telefono1', 'telefono2', 'email',
    'contacto_facturacion', 'email_facturacion', 'anio_apertura', 'tipo_persona',
    'estado', 'vendedor', 'categoria', 'cupo_credito', 'observaciones',
    'fecha_registro', 'ultimo_contacto', 'proximo_contacto'
  ];

  const setClauses: string[] = [];
  const values: any[] = [];

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (setClauses.length === 0) {
    res.status(400).json({ error: 'No hay campos para actualizar' });
    return;
  }

  setClauses.push("updated_at = datetime('now', 'localtime')");
  values.push(req.params.id);

  db.prepare(`UPDATE clients SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Cliente no encontrado' });
    return;
  }
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ message: 'Cliente eliminado correctamente' });
});

export default router;

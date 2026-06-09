process.env.VERCEL = '1';
const { initDb, getDb } = require('./dist/memory-db.js');

async function test() {
  await initDb();
  const db = getDb();

  // Test INSERT
  db.prepare("INSERT INTO clients (identificacion, nombre, estado) VALUES ('123', 'Test Client', 'Activo')").run();
  db.prepare("INSERT INTO clients (identificacion, nombre, estado) VALUES ('456', 'Test Client 2', 'Activo')").run();
  db.prepare("INSERT INTO clients (identificacion, nombre, estado, vendedor, ciudad) VALUES ('789', 'Test Client 3', 'Inactivo', 'Vendedor1', 'Bogota')").run();

  // Test SELECT with WHERE
  let r = db.prepare("SELECT * FROM clients WHERE id = ?").get(1);
  console.log('get by id:', JSON.stringify(r));

  // Test SELECT all with filters
  r = db.prepare("SELECT COUNT(*) as total FROM clients WHERE 1=1").all();
  console.log('count all:', JSON.stringify(r));

  r = db.prepare("SELECT COUNT(*) as total FROM clients WHERE estado = 'Activo'").all();
  console.log('count activo:', JSON.stringify(r));

  // Test SELECT all with WHERE LIKE
  r = db.prepare("SELECT * FROM clients WHERE 1=1 AND (nombre LIKE ? OR identificacion LIKE ?) ORDER BY nombre ASC LIMIT 10 OFFSET 0").all('%Test%', '%');
  console.log('search with LIKE:', JSON.stringify(r));

  // Test UPDATE
  db.prepare("UPDATE clients SET nombre = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run('Updated Name', 1);
  r = db.prepare("SELECT * FROM clients WHERE id = ?").get(1);
  console.log('updated:', JSON.stringify(r));

  // Test DISTINCT
  r = db.prepare("SELECT DISTINCT vendedor FROM clients WHERE vendedor != '' ORDER BY vendedor").all();
  console.log('distinct vendedores:', JSON.stringify(r));

  // Test DELETE
  db.prepare("DELETE FROM clients WHERE id = ?").run(2);
  r = db.prepare("SELECT COUNT(*) as total FROM clients WHERE 1=1").all();
  console.log('count after delete:', JSON.stringify(r));

  // Test GROUP BY
  r = db.prepare("SELECT estado, COUNT(*) as count FROM clients WHERE estado != '' GROUP BY estado ORDER BY count DESC").all();
  console.log('group by estado:', JSON.stringify(r));

  // Test notes
  db.prepare("INSERT INTO notas (client_id, contenido, tipo) VALUES (?, ?, ?)").run(1, 'Test note', 'Llamada');
  r = db.prepare("SELECT * FROM notas WHERE client_id = ? ORDER BY fecha DESC").all(1);
  console.log('notas:', JSON.stringify(r));

  // Test programaciones with JOIN
  db.prepare("INSERT INTO programaciones (client_id, titulo, fecha_programada) VALUES (?, ?, ?)").run(1, 'Test programacion', '2026-06-10');
  r = db.prepare("SELECT p.*, c.nombre as cliente_nombre, c.identificacion as cliente_identificacion FROM programaciones p LEFT JOIN clients c ON c.id = p.client_id WHERE 1=1 ORDER BY p.fecha_programada ASC LIMIT 10 OFFSET 0").all();
  console.log('programaciones with join:', JSON.stringify(r));

  console.log('ALL TESTS PASSED');
}

test().catch(err => console.error('TEST FAILED:', err));

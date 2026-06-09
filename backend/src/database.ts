import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'clientes.db')
  : path.join(__dirname, '..', 'data', 'clientes.db');

let SQL: SqlJsStatic;
let db: SqlJsDatabase;

class Statement {
  private sql: string;

  constructor(sql: string) {
    this.sql = sql;
    const stmt = db.prepare(sql);
    stmt.free();
  }

  get(...params: any[]): any {
    const stmt = db.prepare(this.sql);
    try {
      if (params.length > 0) {
        stmt.bind(params);
      }
      let result: any;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      return result;
    } finally {
      stmt.free();
    }
  }

  all(...params: any[]): any[] {
    const stmt = db.prepare(this.sql);
    try {
      if (params.length > 0) {
        stmt.bind(params);
      }
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  run(...params: any[]): { lastInsertRowid: number; changes: number } {
    if (params.length > 0) {
      db.run(this.sql, params);
    } else {
      db.run(this.sql);
    }
    const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
    const row = result[0]?.values[0];
    return {
      lastInsertRowid: row ? row[0] : 0,
      changes: row ? row[1] : 0,
    };
  }
}

function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function persistDb(): void {
  saveDb();
}

function initSchema(): void {
  db.run('CREATE TABLE IF NOT EXISTS clients ('
    + 'id INTEGER PRIMARY KEY AUTOINCREMENT,'
    + 'identificacion TEXT NOT NULL UNIQUE,'
    + 'tipo_identificacion TEXT DEFAULT \'NIT\','
    + 'nombre TEXT NOT NULL,'
    + 'nombre_comercial TEXT DEFAULT \'\','
    + 'nombre_contacto TEXT DEFAULT \'\','
    + 'direccion TEXT DEFAULT \'\','
    + 'ciudad TEXT DEFAULT \'\','
    + 'departamento TEXT DEFAULT \'\','
    + 'pais TEXT DEFAULT \'Colombia\','
    + 'telefono1 TEXT DEFAULT \'\','
    + 'telefono2 TEXT DEFAULT \'\','
    + 'email TEXT DEFAULT \'\','
    + 'contacto_facturacion TEXT DEFAULT \'\','
    + 'email_facturacion TEXT DEFAULT \'\','
    + 'anio_apertura INTEGER DEFAULT NULL,'
    + 'tipo_persona TEXT DEFAULT \'Natural\','
    + 'estado TEXT DEFAULT \'Activo\','
    + 'vendedor TEXT DEFAULT \'\','
    + 'categoria TEXT DEFAULT \'\','
    + 'cupo_credito REAL DEFAULT 0,'
    + 'observaciones TEXT DEFAULT \'\','
    + 'fecha_registro TEXT DEFAULT NULL,'
    + 'ultimo_contacto TEXT DEFAULT NULL,'
    + 'proximo_contacto TEXT DEFAULT NULL,'
    + 'created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')),'
    + 'updated_at TEXT DEFAULT (datetime(\'now\', \'localtime\'))'
    + ')');

  db.run('CREATE TABLE IF NOT EXISTS notas ('
    + 'id INTEGER PRIMARY KEY AUTOINCREMENT,'
    + 'client_id INTEGER NOT NULL,'
    + 'contenido TEXT NOT NULL,'
    + 'tipo TEXT DEFAULT \'Otro\','
    + 'fecha TEXT DEFAULT (datetime(\'now\', \'localtime\')),'
    + 'created_by TEXT DEFAULT \'Sistema\','
    + 'created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')),'
    + 'FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE'
    + ')');

  db.run('CREATE INDEX IF NOT EXISTS idx_clients_identificacion ON clients(identificacion)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clients_nombre ON clients(nombre)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clients_estado ON clients(estado)');
  db.run('CREATE TABLE IF NOT EXISTS programaciones ('
    + 'id INTEGER PRIMARY KEY AUTOINCREMENT,'
    + 'client_id INTEGER NOT NULL,'
    + 'titulo TEXT NOT NULL,'
    + 'descripcion TEXT DEFAULT \'\','
    + 'tipo TEXT DEFAULT \'Llamada\','
    + 'fecha_programada TEXT NOT NULL,'
    + 'hora_programada TEXT DEFAULT \'09:00\','
    + 'duracion_estimada INTEGER DEFAULT 30,'
    + 'estado TEXT DEFAULT \'Pendiente\','
    + 'prioridad TEXT DEFAULT \'Media\','
    + 'created_by TEXT DEFAULT \'Sistema\','
    + 'created_at TEXT DEFAULT (datetime(\'now\', \'localtime\')),'
    + 'updated_at TEXT DEFAULT (datetime(\'now\', \'localtime\')),'
    + 'FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE'
    + ')');

  db.run('CREATE INDEX IF NOT EXISTS idx_notas_client_id ON notas(client_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_programaciones_fecha ON programaciones(fecha_programada)');
  db.run('CREATE INDEX IF NOT EXISTS idx_programaciones_client ON programaciones(client_id)');
}

export interface DbWrapper {
  prepare(sql: string): Statement;
  exec(sql: string): any;
}

export async function initDb(): Promise<void> {
  SQL = await initSqlJs();

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  initSchema();
  saveDb();
}

export function getDb(): DbWrapper {
  return {
    prepare: (sql: string) => new Statement(sql),
    exec: (sql: string) => db.exec(sql),
  };
}

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
  }
}

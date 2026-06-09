"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistDb = persistDb;
exports.initDb = initDb;
exports.getDb = getDb;
exports.closeDb = closeDb;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_PATH = process.env.VERCEL
    ? path_1.default.join('/tmp', 'clientes.db')
    : path_1.default.join(__dirname, '..', 'data', 'clientes.db');
let SQL;
let db;
async function getSqlJs() {
    const initSqlJs = (await Promise.resolve().then(() => __importStar(require('sql.js')))).default;
    return initSqlJs({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`,
    });
}
class Statement {
    sql;
    constructor(sql) {
        this.sql = sql;
        const stmt = db.prepare(sql);
        stmt.free();
    }
    get(...params) {
        const stmt = db.prepare(this.sql);
        try {
            if (params.length > 0) {
                stmt.bind(params);
            }
            let result;
            if (stmt.step()) {
                result = stmt.getAsObject();
            }
            return result;
        }
        finally {
            stmt.free();
        }
    }
    all(...params) {
        const stmt = db.prepare(this.sql);
        try {
            if (params.length > 0) {
                stmt.bind(params);
            }
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            return results;
        }
        finally {
            stmt.free();
        }
    }
    run(...params) {
        if (params.length > 0) {
            db.run(this.sql, params);
        }
        else {
            db.run(this.sql);
        }
        const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
        const row = result[0]?.values[0];
        return {
            lastInsertRowid: row ? Number(row[0]) : 0,
            changes: row ? Number(row[1]) : 0,
        };
    }
}
function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs_1.default.writeFileSync(DB_PATH, buffer);
}
function persistDb() {
    saveDb();
}
function initSchema() {
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
async function initDb() {
    SQL = await getSqlJs();
    const dir = path_1.default.dirname(DB_PATH);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    if (fs_1.default.existsSync(DB_PATH)) {
        const buffer = fs_1.default.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    }
    else {
        db = new SQL.Database();
    }
    db.run('PRAGMA foreign_keys = ON');
    initSchema();
    saveDb();
}
function getDb() {
    return {
        prepare: (sql) => new Statement(sql),
        exec: (sql) => db.exec(sql),
    };
}
function closeDb() {
    if (db) {
        saveDb();
        db.close();
    }
}
//# sourceMappingURL=database.js.map
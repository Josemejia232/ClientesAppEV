"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.get('/client/:clientId', (req, res) => {
    const db = (0, database_1.getDb)();
    const rows = db.prepare('SELECT * FROM notas WHERE client_id = ? ORDER BY fecha DESC').all(req.params.clientId);
    res.json(rows);
});
router.post('/', (req, res) => {
    const db = (0, database_1.getDb)();
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
router.delete('/:id', (req, res) => {
    const db = (0, database_1.getDb)();
    const existing = db.prepare('SELECT * FROM notas WHERE id = ?').get(req.params.id);
    if (!existing) {
        res.status(404).json({ error: 'Nota no encontrada' });
        return;
    }
    db.prepare('DELETE FROM notas WHERE id = ?').run(req.params.id);
    res.json({ message: 'Nota eliminada correctamente' });
});
exports.default = router;
//# sourceMappingURL=notes.js.map
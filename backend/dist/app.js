"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
Object.defineProperty(exports, "initDb", { enumerable: true, get: function () { return database_1.initDb; } });
const clients_1 = __importDefault(require("./routes/clients"));
const notes_1 = __importDefault(require("./routes/notes"));
const programaciones_1 = __importDefault(require("./routes/programaciones"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            try {
                (0, database_1.persistDb)();
            }
            catch (_) { }
        }
        return originalEnd(...args);
    };
    next();
});
app.use('/api/clients', clients_1.default);
app.use('/api/notes', notes_1.default);
app.use('/api/programaciones', programaciones_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
//# sourceMappingURL=app.js.map
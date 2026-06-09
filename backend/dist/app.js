"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.initDb = initApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database");
const seed_data_1 = require("./seed-data");
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
app.use('/clients', clients_1.default);
app.use('/notes', notes_1.default);
app.use('/programaciones', programaciones_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
let seeded = false;
async function initApp() {
    await (0, database_1.initDb)();
    if (process.env.VERCEL && !seeded) {
        await (0, seed_data_1.runSeed)();
        seeded = true;
    }
}
//# sourceMappingURL=app.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = require("./app");
let dbReady = null;
async function handler(req, res) {
    if (!dbReady) {
        dbReady = (0, app_1.initDb)().catch((err) => {
            console.error('DB init error:', err);
            dbReady = null;
            throw err;
        });
    }
    await dbReady;
    (0, app_1.app)(req, res);
}
//# sourceMappingURL=vercel.js.map
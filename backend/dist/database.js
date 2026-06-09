"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDb = exports.persistDb = exports.getDb = exports.initDb = void 0;
const useMemory = !!process.env.VERCEL;
let impl;
if (useMemory) {
    impl = require('./memory-db');
}
else {
    impl = require('./sqlite-db');
}
exports.initDb = impl.initDb;
exports.getDb = impl.getDb;
exports.persistDb = impl.persistDb;
exports.closeDb = impl.closeDb;
//# sourceMappingURL=database.js.map
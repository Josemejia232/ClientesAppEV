import type { DbWrapper } from './sqlite-db';

const useMemory = !!process.env.VERCEL;

let impl: {
  initDb: () => Promise<void>;
  getDb: () => DbWrapper;
  persistDb: () => void;
  closeDb: () => void;
};

if (useMemory) {
  impl = require('./memory-db');
} else {
  impl = require('./sqlite-db');
}

export type { DbWrapper };
export const initDb = impl.initDb;
export const getDb = impl.getDb;
export const persistDb = impl.persistDb;
export const closeDb = impl.closeDb;

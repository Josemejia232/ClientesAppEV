import type { DbWrapper } from './sqlite-db';
export type { DbWrapper };
export declare const initDb: () => Promise<void>;
export declare const getDb: () => DbWrapper;
export declare const persistDb: () => void;
export declare const closeDb: () => void;
//# sourceMappingURL=database.d.ts.map
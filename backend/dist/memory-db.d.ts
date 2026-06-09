export declare function getDb(): {
    prepare: (sql: string) => {
        get: (...allParams: any[]) => any;
        all: (...allParams: any[]) => any[];
        run: (...allParams: any[]) => {
            lastInsertRowid: number;
            changes: number;
        };
    };
    exec: (_sql: string) => any[];
};
export declare function initDb(): Promise<void>;
export declare function persistDb(): void;
export declare function closeDb(): void;
//# sourceMappingURL=memory-db.d.ts.map
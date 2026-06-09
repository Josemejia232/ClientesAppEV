declare class Statement {
    private sql;
    constructor(sql: string);
    get(...params: any[]): any;
    all(...params: any[]): any[];
    run(...params: any[]): {
        lastInsertRowid: number;
        changes: number;
    };
}
export declare function persistDb(): void;
export interface DbWrapper {
    prepare(sql: string): Statement;
    exec(sql: string): any;
}
export declare function initDb(): Promise<void>;
export declare function getDb(): DbWrapper;
export declare function closeDb(): void;
export {};
//# sourceMappingURL=sqlite-db.d.ts.map
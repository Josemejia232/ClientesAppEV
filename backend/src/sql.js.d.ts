declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  interface Statement {
    bind(params?: any[]): boolean
    step(): boolean
    getAsObject(): any
    run(): void
    free(): boolean
    reset(): void
  }

  interface Database {
    run(sql: string, params?: any[]): void
    exec(sql: string): QueryExecResult[]
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>
}

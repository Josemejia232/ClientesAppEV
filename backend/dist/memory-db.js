"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initDb = initDb;
exports.persistDb = persistDb;
exports.closeDb = closeDb;
let nextId = { clients: 1, notas: 1, programaciones: 1 };
const tables = {
    clients: [],
    notas: [],
    programaciones: [],
};
function sqlEscape(val) {
    return val.replace(/'/g, "''");
}
function datetime(now, modifier) {
    const d = new Date();
    if (modifier === 'localtime') {
        const offset = d.getTimezoneOffset();
        d.setMinutes(d.getMinutes() - offset);
    }
    return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}
function dateFn(now) {
    const d = new Date();
    return d.toISOString().split('T')[0];
}
function julianday(dateStr) {
    const d = new Date(dateStr);
    const epoch = new Date('2000-01-01');
    return (d.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24) + 2451545;
}
function evalExpr(expr, row, params) {
    expr = expr.trim();
    if (expr === '1')
        return 1;
    if (expr === '1=1')
        return true;
    if (expr.startsWith("'") && expr.endsWith("'"))
        return expr.slice(1, -1);
    if (expr === '?')
        return params.shift();
    if (expr.toUpperCase() === 'TRUE')
        return true;
    if (expr.toUpperCase() === 'FALSE')
        return false;
    if (!isNaN(Number(expr)))
        return Number(expr);
    if (expr.includes('datetime(') || expr.includes("'now'"))
        return datetime('now', 'localtime');
    if (expr.startsWith("date('now')"))
        return dateFn('now');
    if (expr.includes('julianday(')) {
        const match = expr.match(/julianday\(['"]?(.+?)['"]?\)/);
        if (match)
            return julianday(evalStr(match[1], row));
        return 0;
    }
    if (expr.includes("'now'")) {
        const d = new Date();
        if (expr.includes("'localtime'")) {
            const offset = d.getTimezoneOffset();
            d.setMinutes(d.getMinutes() - offset);
        }
        return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    }
    if (row && expr in row)
        return row[expr];
    return undefined;
}
function evalStr(str, row) {
    str = str.trim();
    if (str.startsWith("'") && str.endsWith("'"))
        return str.slice(1, -1);
    if (str.startsWith('"') && str.endsWith('"'))
        return str.slice(1, -1);
    return String(row?.[str] ?? str);
}
function parseWhere(sql) {
    const whereMatch = sql.match(/WHERE\s+(.*?)(?:ORDER BY|GROUP BY|LIMIT|$)/i);
    if (!whereMatch)
        return { condition: '1=1', params: [] };
    return { condition: whereMatch[1].trim(), params: [] };
}
function evaluateCondition(condition, row, params) {
    condition = condition.replace(/\b(\w+)\.(\w+)\b/g, '$2');
    const orParts = condition.split(/\s+OR\s+/i);
    return orParts.some(orPart => {
        const andParts = orPart.split(/\s+AND\s+/i);
        return andParts.every(part => {
            part = part.trim();
            if (part === '1=1' || part === '1')
                return true;
            if (part.includes('IS NOT NULL')) {
                const col = part.replace(/\s+IS NOT NULL/i, '').trim();
                return row[col] !== null && row[col] !== undefined && row[col] !== '';
            }
            if (part.includes('IS NULL')) {
                const col = part.replace(/\s+IS NULL/i, '').trim();
                return row[col] === null || row[col] === undefined || row[col] === '';
            }
            if (part.includes('!=')) {
                const [l, r] = part.split('!=').map(s => s.trim());
                const lv = row[l];
                const rv = r.startsWith("'") ? r.slice(1, -1) : (r === '?' ? params.shift() : r);
                return lv != rv;
            }
            if (part.includes('>=')) {
                const [l, r] = part.split('>=').map(s => s.trim());
                const lv = evalExpr(l, row, params);
                const rv = evalExpr(r, row, params);
                return lv >= rv;
            }
            if (part.includes('<=')) {
                const [l, r] = part.split('<=').map(s => s.trim());
                const lv = evalExpr(l, row, params);
                const rv = evalExpr(r, row, params);
                return lv <= rv;
            }
            if (part.includes('>')) {
                const [l, r] = part.split('>').map(s => s.trim());
                const lv = evalExpr(l, row, params);
                const rv = evalExpr(r, row, params);
                return lv > rv;
            }
            if (part.includes('<')) {
                const [l, r] = part.split('<').map(s => s.trim());
                const lv = evalExpr(l, row, params);
                const rv = evalExpr(r, row, params);
                return lv < rv;
            }
            if (part.includes('LIKE')) {
                const li = part.indexOf('LIKE');
                const col = part.slice(0, li).trim();
                const patternRaw = part.slice(li + 4).trim();
                const pattern = patternRaw.startsWith("'") ? patternRaw.slice(1, -1) : String(params.shift() ?? '');
                const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
                return regex.test(String(row[col] ?? ''));
            }
            if (part.includes('=')) {
                const eq = part.indexOf('=');
                const col = part.slice(0, eq).trim();
                const valRaw = part.slice(eq + 1).trim();
                const val = valRaw.startsWith("'") ? valRaw.slice(1, -1) : (valRaw === '?' ? params.shift() : valRaw);
                const rv = row[col];
                if (val === null || val === undefined)
                    return rv === null || rv === undefined || rv === '';
                return String(rv) === String(val);
            }
            return true;
        });
    });
}
function parseColumns(sql) {
    const selMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (!selMatch)
        return ['*'];
    const cols = selMatch[1].trim();
    if (cols === '*')
        return ['*'];
    if (cols.includes('COUNT('))
        return [];
    if (cols.includes('DISTINCT')) {
        const match = cols.match(/DISTINCT\s+(\w+)/i);
        return match ? [match[1]] : [];
    }
    const aliases = [];
    cols.split(',').forEach(c => {
        const asMatch = c.match(/(\w+(?:\.\w+)?)(?:\s+as\s+(\w+))?/i);
        if (asMatch)
            aliases.push(asMatch[2] || asMatch[1]);
    });
    return aliases;
}
function parseFrom(sql) {
    const fromMatch = sql.match(/FROM\s+(\w+)(?:\s+(\w+))?(?:\s+(LEFT\s+)?JOIN\s+(\w+)(?:\s+(?!ON\b)(\w+))?\s+ON\s+(.+?))?(?:\s+WHERE|\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    if (!fromMatch)
        return { table: '' };
    const table = fromMatch[1];
    if (fromMatch[4]) {
        return {
            table,
            join: {
                type: fromMatch[3] ? 'LEFT' : 'INNER',
                table: fromMatch[4],
                on: fromMatch[6]?.trim() || '',
            },
        };
    }
    return { table };
}
function parseOrderBy(sql) {
    const orderMatch = sql.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
    if (!orderMatch)
        return [];
    const parts = orderMatch[1].split(',');
    return parts.map(p => {
        const m = p.trim().match(/(\S+)\s+(ASC|DESC)/i);
        return m ? { field: m[1], dir: m[2].toUpperCase() } : { field: p.trim(), dir: 'ASC' };
    });
}
function parseLimitOffset(sql) {
    const limitMatch = sql.match(/LIMIT\s+(\d+|\?)(?:\s+OFFSET\s+(\d+|\?))?/i);
    if (!limitMatch)
        return null;
    return {
        limit: limitMatch[1] === '?' ? 0 : parseInt(limitMatch[1]),
        offset: limitMatch[2] && limitMatch[2] !== '?' ? parseInt(limitMatch[2]) : (limitMatch[2] === '?' ? 0 : 0),
        limitIsParam: limitMatch[1] === '?',
        offsetIsParam: limitMatch[2] === '?',
    };
}
function toSqlDate() {
    return new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
}
function toSqlDateOnly() {
    return new Date().toISOString().split('T')[0];
}
function getDb() {
    const prepare = (sql) => ({
        get: (...allParams) => {
            const params = [...allParams];
            sql = sql.replace(/\s+/g, ' ').trim();
            const op = sql.match(/^(\w+)/i)?.[1]?.toUpperCase();
            if (op === 'SELECT') {
                const { table, join } = parseFrom(sql);
                const condition = parseWhere(sql);
                const rows = tables[table] || [];
                const filtered = rows.filter(r => evaluateCondition(condition.condition, r, [...params]));
                const isCount = /COUNT\s*\(\s*\*\s*\)/i.test(sql);
                if (isCount) {
                    const aliasMatch = sql.match(/COUNT\s*\(\s*\*\s*\)(?:\s+as\s+(\w+))?/i);
                    return { [aliasMatch?.[1] || 'count']: filtered.length };
                }
                if (join) {
                    const joinRows = tables[join.table] || [];
                    const [leftCol, rightCol] = join.on.split('=').map(s => s.trim());
                    const lCol = leftCol.includes('.') ? leftCol.split('.')[1] : leftCol;
                    const rCol = rightCol.includes('.') ? rightCol.split('.')[1] : rightCol;
                    return filtered.map(r => {
                        const joined = joinRows.find(jr => String(jr[rCol]) === String(r[lCol])) || {};
                        const result = { ...r };
                        Object.entries(joined).forEach(([k, v]) => {
                            if (!(k in r))
                                result[k] = v;
                        });
                        return result;
                    })[0] || null;
                }
                return filtered[0] || null;
            }
            if (op === 'INSERT') {
                const tableMatch = sql.match(/INTO\s+(\w+)/i);
                const tableName = tableMatch?.[1] || '';
                const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
                const valsMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
                if (tableName && colsMatch && valsMatch) {
                    const cols = colsMatch[1].split(',').map(c => c.trim());
                    const vals = valsMatch[1].split(',').map(v => {
                        const vt = v.trim();
                        if (vt === '?')
                            return params.shift();
                        if (vt.startsWith("'") && vt.endsWith("'"))
                            return vt.slice(1, -1);
                        if (vt.startsWith('"') && vt.endsWith('"'))
                            return vt.slice(1, -1);
                        if (vt.match(/datetime/i))
                            return toSqlDate();
                        if (vt.match(/date\(/i))
                            return toSqlDateOnly();
                        if (vt === 'NULL' || vt === 'null')
                            return null;
                        return isNaN(Number(vt)) ? vt : Number(vt);
                    });
                    const row = {};
                    cols.forEach((c, i) => { row[c] = vals[i]; });
                    row.id = nextId[tableName]++;
                    tables[tableName].push(row);
                    return { lastInsertRowid: row.id, changes: 1 };
                }
                return { lastInsertRowid: 0, changes: 0 };
            }
            if (op === 'UPDATE') {
                const tableName = sql.match(/UPDATE\s+(\w+)/i)?.[1] || '';
                const setMatch = sql.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
                const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
                if (tableName && setMatch) {
                    const sets = setMatch[1].split(',').map(x => x.trim());
                    const setParamsCount = (setMatch[1].match(/\?/g) || []).length;
                    const rows = tables[tableName] || [];
                    const filtered = whereMatch ? rows.filter(r => {
                        const p = [...params.slice(setParamsCount)];
                        return evaluateCondition(whereMatch[1].trim(), r, p);
                    }) : [];
                    const changes = filtered.length;
                    filtered.forEach(r => {
                        sets.forEach(st => {
                            const [col, valExpr] = st.split('=').map(x => x.trim());
                            const vt = valExpr.trim();
                            if (vt === '?')
                                r[col] = params.shift();
                            else if (/datetime/i.test(vt))
                                r[col] = toSqlDate();
                            else if (/date\(/i.test(vt))
                                r[col] = toSqlDateOnly();
                            else if (vt.startsWith("'") && vt.endsWith("'"))
                                r[col] = vt.slice(1, -1);
                            else {
                                const n = Number(vt);
                                r[col] = isNaN(n) ? vt : n;
                            }
                        });
                    });
                    return { lastInsertRowid: 0, changes };
                }
            }
            if (op === 'DELETE') {
                const tableName = sql.match(/FROM\s+(\w+)/i)?.[1] || '';
                const whereMatch = sql.match(/WHERE\s+(.+?)$/i);
                const rows = tables[tableName] || [];
                const before = rows.length;
                if (whereMatch) {
                    tables[tableName] = rows.filter(r => {
                        const p = [...params];
                        return !evaluateCondition(whereMatch[1].trim(), r, p);
                    });
                    return { lastInsertRowid: 0, changes: before - tables[tableName].length };
                }
                const changes = rows.length;
                tables[tableName] = [];
                return { lastInsertRowid: 0, changes };
            }
            return { lastInsertRowid: 0, changes: 0 };
        },
        all: (...allParams) => {
            const params = [...allParams];
            sql = sql.replace(/\s+/g, ' ').trim();
            sql = sql.replace(/`/g, '');
            const op = sql.match(/^(\w+)/i)?.[1]?.toUpperCase();
            if (op === 'SELECT') {
                const { table, join } = parseFrom(sql);
                const whereCondition = sql.includes('WHERE') ? (sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s|\s+GROUP\s|\s+LIMIT|$)/i)?.[1] || '1=1') : '1=1';
                let filtered = (tables[table] || []).filter(r => {
                    const localParams = [...params];
                    return evaluateCondition(whereCondition, r, localParams);
                });
                const hasGroupBy = /GROUP BY/i.test(sql);
                const isCount = /COUNT\s*\(\s*\*\s*\)/i.test(sql);
                if (isCount && !hasGroupBy) {
                    return [{ total: filtered.length }];
                }
                const isDistinct = /DISTINCT/i.test(sql);
                const colMatch = sql.match(/SELECT\s+(?:DISTINCT\s+)?(\w+)/i);
                if (isDistinct && colMatch) {
                    const col = colMatch[1];
                    const distinct = [...new Set(filtered.map(r => r[col]).filter(v => v))];
                    return distinct.map(v => ({ [col]: v }));
                }
                const groupMatch = sql.match(/GROUP BY\s+(\w+)/i);
                if (groupMatch) {
                    const groupCol = groupMatch[1];
                    const groups = {};
                    filtered.forEach(r => {
                        const key = String(r[groupCol] ?? '');
                        if (!groups[key])
                            groups[key] = { count: 0, item: r };
                        groups[key].count++;
                    });
                    return Object.entries(groups).map(([k, v]) => ({ [groupCol]: k, count: v.count }));
                }
                if (join) {
                    const parts = join.on.split('=').map(s => s.trim());
                    const leftCol = parts[0].includes('.') ? parts[0].split('.').pop() : parts[0];
                    const rightCol = parts[1].includes('.') ? parts[1].split('.').pop() : parts[1];
                    const joinRows = tables[join.table] || [];
                    const joined = filtered.map(r => {
                        const match = joinRows.find(jr => String(jr[rightCol]) === String(r[leftCol])) || {};
                        const result = { ...r };
                        Object.entries(match).forEach(([k, v]) => {
                            if (!(k in r))
                                result[k] = v;
                        });
                        return result;
                    });
                    filtered = joined;
                }
                const orderBys = parseOrderBy(sql);
                orderBys.forEach(ob => {
                    const field = ob.field.includes('.') ? ob.field.split('.')[1] : ob.field;
                    filtered.sort((a, b) => {
                        const av = a[field] ?? '';
                        const bv = b[field] ?? '';
                        if (typeof av === 'number' && typeof bv === 'number')
                            return ob.dir === 'ASC' ? av - bv : bv - av;
                        return ob.dir === 'ASC' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                    });
                });
                const lo = parseLimitOffset(sql);
                if (lo) {
                    const whereQCount = (whereCondition.match(/\?/g) || []).length;
                    const limit = lo.limitIsParam ? Number(params[whereQCount]) : lo.limit;
                    const offset = lo.offsetIsParam ? Number(params[whereQCount + 1] || 0) : lo.offset;
                    filtered = filtered.slice(offset, offset + limit);
                }
                return filtered || [];
            }
            if (op === 'PRAGMA')
                return [];
            return [];
        },
        run: (...allParams) => {
            const params = [...allParams];
            const s = sql.replace(/\s+/g, ' ').trim();
            const op = s.match(/^(\w+)/i)?.[1]?.toUpperCase();
            if (op === 'INSERT')
                return prepare(s).get(...params);
            if (op === 'UPDATE') {
                const tableName = s.match(/UPDATE\s+(\w+)/i)?.[1] || '';
                const setMatch = s.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
                const whereMatch = s.match(/WHERE\s+(.+?)$/i);
                if (tableName && setMatch) {
                    const sets = setMatch[1].split(',').map(x => x.trim());
                    const setParamsCount = (setMatch[1].match(/\?/g) || []).length;
                    const rows = tables[tableName] || [];
                    const filtered = whereMatch ? rows.filter(r => {
                        const p = [...params.slice(setParamsCount)];
                        return evaluateCondition(whereMatch[1].trim(), r, p);
                    }) : [];
                    const changes = filtered.length;
                    filtered.forEach(r => {
                        sets.forEach(st => {
                            const [col, valExpr] = st.split('=').map(x => x.trim());
                            const vt = valExpr.trim();
                            if (vt === '?')
                                r[col] = params.shift();
                            else if (/datetime/i.test(vt))
                                r[col] = toSqlDate();
                            else if (/date\(/i.test(vt))
                                r[col] = toSqlDateOnly();
                            else if (vt.startsWith("'") && vt.endsWith("'"))
                                r[col] = vt.slice(1, -1);
                            else {
                                const n = Number(vt);
                                r[col] = isNaN(n) ? vt : n;
                            }
                        });
                    });
                    return { lastInsertRowid: 0, changes };
                }
            }
            if (op === 'DELETE') {
                const tableName = s.match(/FROM\s+(\w+)/i)?.[1] || '';
                const whereMatch = s.match(/WHERE\s+(.+?)$/i);
                const rows = tables[tableName] || [];
                const before = rows.length;
                if (whereMatch) {
                    tables[tableName] = rows.filter(r => {
                        const p = [...params];
                        return !evaluateCondition(whereMatch[1].trim(), r, p);
                    });
                    return { lastInsertRowid: 0, changes: before - tables[tableName].length };
                }
                tables[tableName] = [];
                return { lastInsertRowid: 0, changes: before };
            }
            return { lastInsertRowid: 0, changes: 0 };
        },
    });
    const exec = (_sql) => {
        const s = _sql.replace(/\s+/g, ' ').trim();
        if (s.startsWith('CREATE TABLE')) {
            const tableMatch = s.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
            if (tableMatch) {
                const tableName = tableMatch[1];
                if (!tables[tableName])
                    tables[tableName] = [];
                if (tableName === 'clients')
                    nextId.clients = 1;
                if (tableName === 'notas')
                    nextId.notas = 1;
                if (tableName === 'programaciones')
                    nextId.programaciones = 1;
            }
            return [];
        }
        if (s.startsWith('CREATE INDEX'))
            return [];
        if (s.startsWith('PRAGMA'))
            return [];
        if (s.startsWith('SELECT last_insert_rowid')) {
            return [{ columns: ['id', 'changes'], values: [[0, 0]] }];
        }
        if (s.startsWith('UPDATE')) {
            const tableMatch = s.match(/UPDATE\s+(\w+)/i);
            const tableName = tableMatch?.[1] || '';
            const setMatch = s.match(/SET\s+(.+?)(?:\s+WHERE|$)/i);
            const whereMatch = s.match(/WHERE\s+(.+?)$/i);
            if (tableName && setMatch) {
                const sets = setMatch[1].split(',').map(st => st.trim());
                const rows = tables[tableName] || [];
                const filtered = whereMatch ? rows.filter(r => evaluateCondition(whereMatch[1].trim(), r, [])) : [];
                filtered.forEach(r => {
                    sets.forEach(st => {
                        const [col, valExpr] = st.split('=').map(x => x.trim());
                        const vt = valExpr.trim();
                        if (vt.match(/datetime/i))
                            r[col] = toSqlDate();
                        else if (vt.match(/date\(/i))
                            r[col] = toSqlDateOnly();
                    });
                });
            }
            return [];
        }
        if (/^INSERT\s+INTO/i.test(s)) {
            const tableMatch = s.match(/INTO\s+(\w+)/i);
            const tableName = tableMatch?.[1] || '';
            const colsMatch = s.match(/\(([^)]+)\)\s*VALUES/i);
            const valsMatch = s.match(/VALUES\s*\(([^)]+)\)/i);
            if (tableName && colsMatch && valsMatch) {
                const cols = colsMatch[1].split(',').map(c => c.trim());
                const vals = valsMatch[1].split(',').map(v => {
                    const vt = v.trim();
                    if (vt.startsWith("'") && vt.endsWith("'"))
                        return vt.slice(1, -1);
                    if (vt.match(/datetime/i))
                        return toSqlDate();
                    if (vt.match(/date\(/i))
                        return toSqlDateOnly();
                    if (vt === 'NULL' || vt === 'null')
                        return null;
                    return isNaN(Number(vt)) ? vt : Number(vt);
                });
                const row = {};
                cols.forEach((c, i) => { row[c] = vals[i]; });
                row.id = nextId[tableName]++;
                tables[tableName].push(row);
                return [{ columns: ['id', 'changes'], values: [[row.id, 1]] }];
            }
        }
        return [];
    };
    return { prepare, exec };
}
async function initDb() {
    tables.clients = [];
    tables.notas = [];
    tables.programaciones = [];
    nextId = { clients: 1, notas: 1, programaciones: 1 };
}
function persistDb() { }
function closeDb() { }
//# sourceMappingURL=memory-db.js.map
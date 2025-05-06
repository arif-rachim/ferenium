import {Table} from "../panels/database/getTables.ts";
import sqlite, {getDatabase} from "../panels/database/sqlite.ts";
import {BindParams, SqlValue} from "sql.js";
import {zodSchemaToJson} from "../../../core/utils/zodSchemaToJson.ts";
import {createLogger} from "../../../core/utils/logger.ts";
import {isNotEmpty} from "../../../core/utils/isNotEmpty.ts";

export function composeTableSchema(table: Table) {
    const schema: string[] = [];
    for (const info of table.tableInfo) {
        const type = info.type;
        schema.push(`${info.name}:${type}`)
    }
    return `z.object({\n\t${schema.join(',\n\t')}\n})`
}

export function composeArraySchema(data: Array<unknown>) {
    const schema: Record<string, string> = {};

    for (const i of data) {
        const item = i as Record<string, string>;
        Object.keys(item).forEach(key => {
            // we loop it first
            let type = 'any';
            if (typeof item[key] === 'number') {
                type = 'number'
            } else if (typeof item[key] === 'string') {
                type = 'string'
            }
            if (!(key in schema)) {
                schema[key] = type;
            } else {
                const prevSchemaIsNull = schema[key] === 'any';
                const nextTypeIsNotNull = type === 'any';
                if (prevSchemaIsNull && nextTypeIsNotNull) {
                    schema[key] = type
                }
            }
        })
    }
    return `z.object({\n\t${Object.keys(schema).map(k => {
        const zodType = {
            'any': 'z.any()',
            'number': 'z.number().nullable().optional()',
            'string': 'z.string().nullable().optional()'
        }
        const type = schema[k] as keyof typeof zodType;
        return `${k}:${zodType[type]}`;
    }).join(',\n\t')}\n})`;
}

export function composeDbSchema(allTables: Array<Table>) {

    // lets group them first based on the databases

    const dbFiles = allTables.reduce((dbFile,table) => {
        dbFile[table.fileName] = dbFile[table.fileName] ?? [];
        dbFile[table.fileName].push(table);
        return dbFile;
    },{} as Record<string, Array<Table>>) ;

    const dbSchema = [];
    for (const dbFile of Object.keys(dbFiles)) {
        const tables = dbFiles[dbFile]
        const tableSchema = [];
        for (const table of tables) {
            tableSchema.push(`${table.name} : ${composeTableSchema(table)} `)
        }
        const tSchema = `z.object({ ${tableSchema.join(',')} })`;
        dbSchema.push(`${dbFile} : ${tSchema} `)
    }
    const schema = `z.object({ ${dbSchema.join(',')} })`


    const schemaInJson = zodSchemaToJson(schema);
    return `
type DbSchema = ${schemaInJson}
type ConvertToSortOrder<T> = {
    [K in keyof T] : 'asc'|'desc'|undefined;
}
type BindParams = Array<string|number|null> | Record<string, string|number|null> 
declare const db:{
    record:<F extends keyof DbSchema, N extends keyof DbSchema[F]>(file:F,name:N,item:DbSchema[F][N]) => Promise<DbSchema[F][N]>,
    remove:<F extends keyof DbSchema, N extends keyof DbSchema[F]>(file:F,name:N,filter:DbSchema[F][N]) => Promise<DbSchema[F][N]>,
    read:<F extends keyof DbSchema, N extends keyof DbSchema[F]>(file:F,name:N,filter:DbSchema[F][N],sort?:ConvertToSortOrder<DbSchema[F][N]>) => Promise<Array<DbSchema[F][N]>>,
    find:<F extends keyof DbSchema, N extends keyof DbSchema[F]>(file:F,name:N,filter:DbSchema[F][N]) => Promise<DbSchema[F][N]|undefined>,
    query : <F extends keyof DbSchema>(file:F, query:string,params:BindParams) => Promise<Array<Record<string,string|number|null>>>,
    commit: <F extends keyof DbSchema>(file:F) => Promise<void>,
    updateRecord:<F extends keyof DbSchema, N extends keyof DbSchema[F]>(file:F,name:N,item:DbSchema[F][N],keys:Array<keyof DbSchema[F][N]>|keyof DbSchema[F][N]) => Promise<DbSchema[F][N]>,
    isExist : <F extends keyof DbSchema>(file:F) => Promise<boolean>
};
`
}

const log = createLogger('db-error');

export function dbSchemaInitialization() {

    async function record(fileName: string, tableName: string, item: Record<string, SqlValue>) {
        const query = `INSERT INTO ${tableName} (${Object.keys(item).join(', ')})
                       VALUES (${Object.keys(item).map(() => `?`).join(', ')})`
        const result = await sqlite({
            type: 'executeQuery',
            query: query,
            params: Object.values(item).map(i => i === undefined ? null : i),
            fileName
        });
        if (!result.errors) {
            const readResponse = await read(fileName,tableName, item);
            if (readResponse.length > 0) {
                return readResponse[0];
            }
        } else {
            log.error(result.errors, query)
        }
        return result;
    }

    async function updateRecord(fileName: string, tableName: string, item: Record<string, SqlValue>, keys: string[] | string) {
        const filterKeys = Array.isArray(keys) ? keys : [keys]
        const paramKeys = Object.keys(item).filter(key => !filterKeys.includes(key));

        const param = paramKeys.reduce((result, key) => {
            result[key] = item[key];
            return result;
        }, {} as Record<string, SqlValue>);

        const filter = filterKeys.reduce((result, key) => {
            result[key] = item[key];
            return result;
        }, {} as Record<string, SqlValue>);

        const data = await read(fileName,tableName, filter);
        if (data.length > 0) {
            const valueCondition = paramKeys.map(k => `${k} = ?`).join(' , ').trim();
            const whereCondition = filterKeys.map(k => `${k} = ?`).join(' AND ').trim();
            const query = `UPDATE ${tableName}
                           SET ${valueCondition}
                           WHERE ${whereCondition}`
            const result = await sqlite({
                type: 'executeQuery',
                query: query,
                params: [...Object.values(param), ...Object.values(filter)],
                fileName
            });
            if (!result.errors) {
                const readResponse = await read(fileName,tableName, item);
                if (readResponse.length > 0) {
                    return readResponse[0];
                }
            } else {
                log.error(result.errors, query)
            }
            return result;
        } else {
            return await record(fileName, tableName, item);
        }
    }

    async function remove(fileName:string,tableName: string, filter: Record<string, SqlValue>) {
        const whereCondition = Object.keys(filter).map(k => `${k} = ?`).join(' AND ').trim();
        const query = `DELETE
                       FROM ${tableName} ${whereCondition ? `WHERE ${whereCondition}` : ''}`
        const queryResult = await sqlite({type: 'executeQuery', query: query, params: Object.values(filter),fileName});
        if (queryResult.errors) {
            log.error(queryResult.errors);
            return {};
        }
        return queryResult;
    }

    async function read(fileName:string,tableName: string, filter: Record<string, SqlValue>, order?: Record<string, 'asc' | 'desc' | undefined>): Promise<Array<Record<string, SqlValue>>> {
        const whereCondition = Object.keys(filter).map(k => `${k} = ?`).join(' AND ').trim();
        const orderCondition = Object.keys({...order}).filter(i => i).map(k => `${k} ${(order ?? {})[k]}`).join(', ').trim();
        const qry = `SELECT *
                     FROM ${tableName} ${whereCondition ? `WHERE ${whereCondition}` : ''} ${orderCondition ? `ORDER BY ${orderCondition}` : ''}`
        return query(fileName,qry, Object.values(filter));
    }

    async function query(fileName:string,query: string, params: BindParams): Promise<Array<Record<string, SqlValue>>> {
        const queryResult = await sqlite({type: 'executeQuery', query, params,fileName});
        if (queryResult.errors) {
            log.error(queryResult.errors);
            return [];
        }
        const {columns, values} = queryResult.value as { columns: string[], values: SqlValue[][] }
        const result: Array<Record<string, SqlValue>> = [];
        for (const vals of values) {
            const item = {} as Record<string, SqlValue>;
            let colIndex = 0;
            for (const value of vals) {
                item[columns[colIndex]] = value;
                colIndex++;
            }
            result.push(item);
        }
        return result;
    }

    async function find(fileName:string,tableName: string, filter: Record<string, SqlValue>): Promise<Record<string, SqlValue> | undefined> {
        const result = await read(fileName,tableName, filter);
        if (result.length > 0) {
            return result[0];
        }
        return undefined;
    }

    async function commit(fileName:string) {
        await sqlite({type: 'persistChanges',fileName});
    }

    async function isExist(fileName:string){
        const db = await getDatabase(fileName);
        return isNotEmpty(db);
    }

    return {
        record,
        remove,
        read,
        commit,
        query,
        find,
        updateRecord,
        isExist
    }
}
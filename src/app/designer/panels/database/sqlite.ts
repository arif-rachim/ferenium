import type {BindParams, Database, ParamsObject, SqlValue} from "sql.js";
import {utils} from "../../../../core/utils/utils.ts";
import {createLogger} from "../../../../core/utils/logger.ts";
import {deleteFile, loadFromFile, saveToFile} from "../../../../core/utils/electronApi.ts";
import {deleteOPFS, loadFromOPFS, saveToOPFS} from "../../../../core/utils/opfsApi.ts";

const defaultFileName = 'database.db';
const log = createLogger('[Utils]:Sqlite');
log.setLevel('info');

interface SaveToOPFS {
    type: 'saveToFile',
    binaryArray: Uint8Array,
    fileName?: string
}

interface PersistChanges {
    type: 'persistChanges',
    fileName?: string
}

interface DeleteFromOPFS {
    type: 'deleteFromFile',
    fileName?: string
}

interface LoadFromOPFS {
    type: 'loadFromFile',
    fileName?: string
}

interface ExecuteQuery {
    type: 'executeQuery',
    query: string,
    params?: BindParams,
    fileName?: string
}

type Payload = SaveToOPFS | LoadFromOPFS | ExecuteQuery | DeleteFromOPFS | PersistChanges;

export default async function sqlite(payload: Payload): Promise<{ errors?: string, value?: unknown }> {
    if (payload.type === 'saveToFile') {
        await saveToFile(payload.fileName ?? defaultFileName, payload.binaryArray);
        const result = await saveToOPFS(payload.fileName ?? defaultFileName, payload.binaryArray)
        return {value: undefined, errors: result.success ? undefined : 'Unable to save file'}
    }
    if (payload.type === 'loadFromFile') {
        const data = await loadFromFile(payload.fileName ?? defaultFileName);
        if (data) {
            return {value: data}
        }
        const result = await loadFromOPFS(payload.fileName ?? defaultFileName);
        return {value: result.data, errors: result.success ? undefined : 'Unable to load file'}
    }
    if (payload.type === 'executeQuery') {
        const result = await executeQuery({
            fileName: payload.fileName ?? defaultFileName,
            query: payload.query,
            params: payload.params
        });
        return {value: {columns: result.columns, values: result.values}, errors: result.errors}
    }
    if (payload.type === 'deleteFromFile') {
        await deleteFile(payload.fileName ?? defaultFileName);
        await deleteOPFS(payload.fileName ?? defaultFileName);
        return {value: undefined, errors: undefined}
    }
    if (payload.type === 'persistChanges') {
        await persistDb(payload.fileName ?? defaultFileName);
        return {value: undefined, errors: undefined}
    }
    return {errors: 'Unable to identify payload type', value: ''}
}
//
// async function saveToOPFS({binaryArray, fileName}: {
//     binaryArray: Uint8Array,
//     fileName: string
// }): Promise<{
//     success: boolean
// }> {
//     const root = await navigator.storage.getDirectory();
//     const fileHandle = await root.getFileHandle(fileName, {create: true});
//     const writeableStream = await fileHandle.createWritable();
//     await writeableStream.write(binaryArray);
//     await writeableStream.close();
//     await saveToFile(fileName,binaryArray)
//     return {success: true}
// }
//
// async function loadFromOPFS({fileName}: { fileName: string }): Promise<{ success: boolean, data?: Uint8Array }> {
//     log.debug('[OPFS]Loading', fileName);
//     const unit8Array = await loadFromFile(fileName);
//     if(unit8Array){
//         return {data: unit8Array, success: true};
//     }
//     const root = await navigator.storage.getDirectory();
//     const fileHandle = await root.getFileHandle(fileName);
//     const file = await fileHandle.getFile();
//     const arrayBuffer = await file.arrayBuffer();
//     log.debug('[OPFS]Succesfully loading', fileName);
//     return {data: new Uint8Array(arrayBuffer), success: true};
// }
//
// async function deleteFromOPFS({fileName}: { fileName: string }): Promise<{ success: boolean, data: string }> {
//     log.debug('[OPFS]Removing', fileName);
//     const root = await navigator.storage.getDirectory();
//     try {
//         await deleteFile(fileName);
//         log.debug('[OPFS]Removing entry', fileName);
//         await root.removeEntry(fileName, {recursive: true});
//         log.debug('[OPFS]Clearing cache', fileName);
//         delete database[fileName];
//         log.debug('[OPFS]Succesfully removing', fileName);
//         return {data: '', success: true};
//     } catch (e: unknown) {
//         let message = '';
//         if (e !== undefined && e !== null && typeof e === 'object' && 'message' in e) {
//             message = e.message as string;
//         }
//         return {data: message, success: false};
//     }
//
// }

const database: Record<string, Database> = {};
const initSqlJs = self['initSqlJs'];

async function getDatabase(fileName: string) {
    let db: Database | undefined = undefined;
    if (fileName in database && database[fileName]) {
        db = database[fileName];
    } else {
        try {
            let data = await loadFromFile(fileName);
            if (!data) {
                const res = await loadFromOPFS(fileName);
                data = res.data;
            }
            if (data) {
                log.debug('[DB]opening db', fileName);
                const SQL = await initSqlJs({
                    locateFile: file => `${file}`
                });
                log.debug('[DB]opening db success', fileName);
                db = new SQL.Database(data);
                Object.assign(database, {[fileName]: db});
            }
        } catch (error) {
            log.error(error);
        }
    }
    return db;
}

async function persistDb(fileName: string) {
    const db = await getDatabase(fileName);
    if (db) {
        const binaryArray = db.export();
        await saveToFile(fileName, binaryArray)
        await saveToOPFS(fileName, binaryArray)
    }
}

function cleanUpParams(params?: BindParams): BindParams | undefined {
    if (Array.isArray(params)) {
        return params.map((v: unknown) => {
            if (v instanceof Date) {
                return utils.dateToString(v)
            }
            return v;
        }) as SqlValue[]
    }
    if (params !== null && params !== undefined && typeof params === 'object') {
        return Object.keys(params).reduce((result, key) => {
            if (params && key in params) {
                const v = params[key] as unknown;
                if (v instanceof Date) {
                    result[key] = utils.dateToString(v) as string
                } else {
                    result[key] = v as SqlValue;
                }
            }
            return result;
        }, {} as Record<string, SqlValue>) as ParamsObject;
    }

    return params;
}

async function executeQuery({query, params, fileName}: {
    query: string,
    params?: BindParams,
    fileName: string
}): Promise<{
    errors?: string,
    columns: string[],
    values: SqlValue[][]
}> {
    log.debug('[ExecuteQuery]', query)
    const db = await getDatabase(fileName);
    if (db !== undefined) {
        try {
            params = cleanUpParams(params);
            log.debug('[ExecuteQuery] invoking ', query, params)
            const result = db.exec(query, params);
            if (result.length > 0) {
                const {columns, values} = result.pop()!;
                log.debug('[ExecuteQuery] result ', values.length, 'records', 'columns', columns, 'values', values);
                return {
                    columns,
                    values
                }
            } else {
                log.debug('[ExecuteQuery] result ', result.length, 'records')
            }
            return {
                columns: [],
                values: []
            }
        } catch (err) {
            const error = err as { message: string };
            return {
                errors: error.message,
                columns: [],
                values: []
            }
        }
    }
    return {
        errors: "DB Is undefined",
        columns: [],
        values: []
    }
}

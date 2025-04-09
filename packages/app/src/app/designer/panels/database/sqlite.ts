import type {BindParams, Database, ParamsObject, SqlValue} from "sql.js";
import {utils} from "../../../../core/utils/utils.ts";
import {createLogger} from "../../../../core/utils/logger.ts";
import {deleteFile, loadFromFile, saveToFile} from "../../../../core/utils/electronApi.ts";
import {deleteOPFS, loadFromOPFS, saveToOPFS} from "../../../../core/utils/opfsApi.ts";
import {loadFromNetwork} from "../../../../core/utils/networkApi.ts";
import {infoSignal} from "../../../../core/utils/info.ts";

const defaultFileName = 'database.db';
const log = createLogger('sqlite.ts');

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
        if (result.success) {
            return {value: result.data}
        }
        const networkData = await loadFromNetwork(payload.fileName ?? defaultFileName);
        if (networkData) {
            return {value: networkData}
        }
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
        delete database[payload.fileName ?? defaultFileName];
        return {value: undefined, errors: undefined}
    }
    if (payload.type === 'persistChanges') {
        await persistDb(payload.fileName ?? defaultFileName);
        return {value: undefined, errors: undefined}
    }
    return {errors: 'Unable to identify payload type', value: ''}
}

const database: Record<string, Database> = {};
const initSqlJs = self['initSqlJs'];

async function getDatabase(fileName: string) {
    let db: Database | undefined = undefined;

    if (fileName in database && database[fileName]) {
        db = database[fileName];
    } else {
        try {
            let data:Uint8Array<ArrayBufferLike>|undefined = await loadFromFile(fileName);
            if(data){
                const current = infoSignal.get()
                infoSignal.set({...current,database:{type:'file',path:fileName}})
            }
            if (!data) {
                const res = await loadFromOPFS(fileName);
                data = res && res.data && res.data.length > 0 ? res.data : undefined;
                if(data){
                    const current = infoSignal.get()
                    infoSignal.set({...current,database:{type:'opfs',path:fileName}})
                }
            }
            if (!data) {
                const res = await loadFromNetwork(fileName);
                data = res && res.length > 0 ? res : undefined;
                if(data){
                    const current = infoSignal.get()
                    infoSignal.set({...current,database:{type:'network',path:fileName}})
                }
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

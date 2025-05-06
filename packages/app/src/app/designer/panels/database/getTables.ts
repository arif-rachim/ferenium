import {SqlValue} from "sql.js";
import sqlite from "./sqlite.ts";
import {mapTableInfoTypeToTs} from "./mapTableInfoTypeToTs.ts";
import {Application, FetcherParameter} from "../../AppDesigner.tsx";
import {createLogger} from "../../../../core/utils/logger.ts";
import {useSignal} from "react-hook-signal";
import {createContext, useEffect} from "react";
import {Signal} from "signal-polyfill";

export interface Table {
    type: string,
    name: string,
    tblName: string,
    rootPage: number,
    sql?: string,
    tableInfo: TableInfo[],
    fileName: string
}

export interface Query {
    id: string,
    name: string,
    query: string,
    parameters: Array<FetcherParameter>
    schemaCode: string,
    fileName: string
}

export function useGetTables(application: Application) {
    async function getTablesByFile(fileName: string) {
        const result = await sqlite({
            type: 'executeQuery',
            query: `select *
                    from sqlite_master
                    where type like "table"
                    order by name asc`,
            fileName
        });
        const data: Table[] = [];
        if (!result.errors) {
            if (result.value !== null && typeof result.value === 'object' && 'values' in result.value && 'columns' in result.value) {
                const values = result.value.values as SqlValue[][];

                for (const item of values) {
                    const tableInfo = await getTableInfo(fileName,item[2] as string);
                    data.push({
                        type: item[0] as string,
                        name: item[1] as string,
                        tblName: item[2] as string,
                        rootPage: item[3] as number,
                        sql: item[4] as string,
                        tableInfo,
                        fileName
                    })
                }
            }
        }
        return data;
    }

    const tablesSignal = useSignal<Array<Table>>([]);
    useEffect(() => {
        Promise.all((application.databases ?? []).map(file => getTablesByFile(file))).then(tables => {
            tablesSignal.set(tables.flat());
        })
    }, [application])
    return tablesSignal;
}

export const TableContext = createContext<Signal.State<Array<Table>> | undefined>(undefined);


export interface TableInfo {
    cid: number,
    name: string,
    type: string,
    notnull: number,
    dfltValue?: unknown,
    pk: number
}

const log = createLogger('get-table-info-warn');

export async function getTableInfo(fileName:string,tableName: string) {
    const result = await sqlite({type: 'executeQuery', query: `pragma table_info(${tableName})`,fileName})
    const data: TableInfo[] = [];
    if (!result.errors) {
        if (result.value !== null && typeof result.value === 'object' && 'values' in result.value && 'columns' in result.value) {
            const values = result.value.values as SqlValue[][];
            for (const item of values) {
                const type = item[2] as string;
                if (type === "") {
                    log.warn(`Warning this column is type empty "${item[1]}" from table "${tableName}"`)
                }
                data.push({
                    cid: item[0] as number,
                    name: item[1] as string,
                    type: mapTableInfoTypeToTs(type),
                    notnull: item[3] as number,
                    dfltValue: item[4] as unknown,
                    pk: item[5] as number
                })
            }
        }
    }
    return data;
}

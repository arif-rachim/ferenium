import {ParamsObject, SqlValue} from "sql.js";
import {queryDb, QueryParamsObject} from "./panels/database/queryDb.ts";
import {DEFAULT_ROW_PER_PAGE} from "../data/QueryGrid.tsx";

export async function queryPagination(props: {
    fileName: string,
    query: string,
    params: ParamsObject,
    currentPage: number,
    pageSize: number,
    filter: QueryParamsObject,
    sort: Array<{ column: string, direction: 'asc' | 'desc' }>
}) {
    const {fileName, query, params, currentPage, pageSize, filter, sort} = props;
    const {columns, values, page} = await queryDb(fileName, query, {
        size: pageSize ?? DEFAULT_ROW_PER_PAGE,
        number: currentPage
    }, params, filter, sort)

    const data = values.map(val => {
        const result: Record<string, SqlValue> = {};
        columns.forEach((c, index) => {
            result[c] = val[index]
        })
        return result;
    });
    return ({
        data,
        columns,
        currentPage: page.number,
        totalPage: Math.ceil(page.totalRows / page.size)
    })
}
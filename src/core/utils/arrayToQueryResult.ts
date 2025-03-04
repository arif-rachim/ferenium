import {utils} from "./utils.ts";
import {QueryTypeResult} from "../../app/data/QueryGrid.tsx";
import {QueryTypeParam} from "../../app/designer/variable-initialization/AppVariableInitialization.tsx";
import {isEmpty} from "./isEmpty.ts";
import {SqlValue} from "sql.js";
import {QueryParamsObject} from "../../app/designer/panels/database/queryDb.ts";


export function arrayToQueryResult(array: Array<Record<string, SqlValue>>,
                                   config: QueryTypeParam,
                                   columns: Array<string>,
): QueryTypeResult {
    const {rowPerPage, page, sort} = config;
    let filter = config.filter ?? {};
    filter = Object.keys(filter).reduce((result, key) => {
        if (!isEmpty(filter![key])) {
            result[key] = filter![key]
        }
        return result;
    }, {} as QueryParamsObject)
    let data = Array.isArray(array) ? array : [];
    const filterKeys = Object.keys(filter ?? {});
    if (filterKeys.length > 0) {
        data = data.filter((item) => {
            for (const filterKey of filterKeys) {
                if (filterKey in item) {
                    const itemValue = utils.toString(item[filterKey]) ?? '';
                    if (filter && filterKey in filter) {
                        const filterValue = utils.toString(filter[filterKey] ?? '');
                        if (itemValue.indexOf(filterValue ?? '') < 0) {
                            return false;
                        }
                    }
                }
            }
            return true;
        })
    }
    if (sort) {
        data = data.sort((a, b) => {
            for (const srt of sort) {
                const key = srt.column;
                const aVal = utils.toString(a[key]) ?? '';
                const bVal = utils.toString(b[key]) ?? '';
                const comparison = srt.direction === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
                if (comparison !== 0) {
                    return comparison;
                }
            }
            return 0;
        })
    }

    const currentPage = page ? page : 1;
    const totalPage = rowPerPage ? Math.ceil(data.length / rowPerPage) : 1;
    const firstIndex = rowPerPage ? (currentPage - 1) * rowPerPage : 0;
    const lastIndex = firstIndex + (rowPerPage ?? 0);

    return {
        columns: columns,
        data: data.slice(firstIndex, lastIndex),
        currentPage: currentPage,
        totalPage: totalPage
    }
}
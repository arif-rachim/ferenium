import {Table} from "./getTables.ts";
import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {SqlValue} from "sql.js";
import CollapsibleLabelContainer from "../../../../core/components/CollapsibleLabelContainer.tsx";
import {composeTableSchema} from "../../variable-initialization/dbSchemaInitialization.ts";
import {Editor} from "@monaco-editor/react";
import {QueryTypeResult} from "../../../data/QueryGrid.tsx";
import {queryPagination} from "../../queryPagination.ts";
import {QueryParamsObject} from "./queryDb.ts";
import {SimpleTable} from "./SimpleTable.tsx";
import {SimpleTableFooter} from "./SimpleTableFooter.tsx";

async function queryTable(props: {
    table: Table,
    currentPage: number,
    setTableData: Dispatch<SetStateAction<QueryTypeResult>>,
    filter: QueryParamsObject,
    sort: Array<{ column: string, direction: 'asc' | 'desc' }>
}) {
    const {setTableData, table, currentPage, filter, sort} = props;

    const result = await queryPagination({
        fileName:table.fileName,
        currentPage,
        pageSize: 50,
        query: `SELECT *
                FROM ${table.tblName}`,
        params: {},
        filter,
        sort
    });
    setTableData(oldValue => {
        if (result.data.length > 0) {
            return result;
        }
        if (oldValue.columns && oldValue.columns.length > 0) {
            return {...oldValue, data: [], currentPage: 0, totalPage: 0}
        }
        return oldValue;
    });
}


export default function TableEditor(props: { table: Table }) {
    const {table} = props;
    const [tableData, setTableData] = useState<QueryTypeResult>({columns: [], data: [], currentPage: 0, totalPage: 0});
    const [filter, setFilter] = useState<Record<string, string>>({})
    const [sort, setSort] = useState<Array<{ column: string, direction: 'asc' | 'desc' }>>([])
    useEffect(() => {
        (async () => {
            await queryTable({
                table,
                currentPage: 1,
                setTableData,
                filter,
                sort
            });
        })();
    }, [table, filter, sort]);
    const [isOpen, setOpen] = useState(false);
    return <div
        style={{display: 'flex', flexDirection: 'column', overflow: 'auto', height: '100%'}}>
        <CollapsibleLabelContainer label={'Table Schema'} style={{minHeight: isOpen ? 300 : 32}} defaultOpen={false}
                                   autoGrowWhenOpen={true} onOpenChange={setOpen}>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <Editor
                    language="javascript"
                    value={composeTableSchema(props.table)}
                    options={{
                        selectOnLineNumbers: false,
                        lineNumbers: 'off',
                    }}
                />
            </div>
        </CollapsibleLabelContainer>
        <div style={{flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column'}}>
            <SimpleTable columns={tableData.columns ?? []} data={tableData.data as Array<Record<string, SqlValue>>}
                         filterable={true} filter={filter}
                         onFilterChange={({column, value}) => {
                             setFilter(oldValue => {
                                 const returnValue = {...oldValue};
                                 if (typeof value === 'string') {
                                     returnValue[column] = value;
                                 } else {
                                     returnValue[column] = JSON.stringify(value);
                                 }
                                 return returnValue
                             })
                         }}
                         sortable={true}
                         sort={sort}
                         onSortChange={({column, value}) => {
                             setSort(oldValue => {
                                 const newValue = [...oldValue];
                                 if (value === 'remove') {
                                     return newValue.filter(c => c.column !== column)
                                 }
                                 const itemIndex = newValue.findIndex(c => c.column === column);
                                 if (itemIndex < 0) {
                                     newValue.push({column, direction: value});
                                 } else {
                                     newValue.splice(itemIndex, 1, {column: column, direction: value});
                                 }
                                 return newValue;
                             })
                         }}
            />
        </div>
        <SimpleTableFooter value={tableData?.currentPage ?? 0} totalPages={tableData?.totalPage ?? 1}
                           onChange={async (page) => {
                               await queryTable({
                                   table,
                                   currentPage: page,
                                   setTableData,
                                   filter,
                                   sort
                               });
                           }}/>
    </div>
}




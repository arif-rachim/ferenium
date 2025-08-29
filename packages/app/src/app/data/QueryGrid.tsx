import {QueryType, QueryTypeParam} from "../designer/variable-initialization/AppVariableInitialization.tsx";
import {CSSProperties, forwardRef, useCallback, useEffect, useRef, useState} from "react";
import {Container} from "../designer/AppDesigner.tsx";
import {SqlValue} from "sql.js";
import {queryGridColumnsTemporalColumnsSignal} from "../designer/editor/queryGridColumnsTemporalColumnsSignal.ts";
import {useForwardedRef} from "../../core/hooks/useForwardedRef.ts";
import {DivWithClickOutside} from "../designer/components/DivWithClickOutside.tsx";
import {ColumnsConfig, SimpleTable} from "../designer/panels/database/SimpleTable.tsx";
import {SimpleTableFooter} from "../designer/panels/database/SimpleTableFooter.tsx";
import {CardViewType} from "../designer/editor/ConfigPropertyEditor.tsx";

export type QueryTypeResult = {
    error?: string,
    data?: Record<string, SqlValue>[],
    columns?: string[],
    totalPage?: number,
    currentPage?: number
}
export const DEFAULT_ROW_PER_PAGE = 30;
export const QueryGrid = forwardRef<HTMLDivElement | null, {
    query: QueryType,
    style?: CSSProperties,
    columnsConfig: ColumnsConfig,
    focusedRow?: Record<string, SqlValue>,
    itemToKey?: (item: Record<string, SqlValue>) => string | number,
    onFocusedRowChange?: (props: {
        value: Record<string, SqlValue>,
        data: Array<Record<string, SqlValue>>,
        totalPage: number,
        currentPage: number,
        index: number
    }) => (Promise<void> | void),
    container: Container,
    refreshQueryKey?: string|number,
    onRowDoubleClick?: (props: {
        value: Record<string, SqlValue>,
        data: Array<Record<string, SqlValue>>,
        totalPage: number,
        currentPage: number,
        index: number,
        refresh: () => void
    }) => (Promise<void> | void),
    filterable?: boolean,
    sortable?: boolean,
    pageable?: boolean,
    rowPerPage?: number,
    paginationButtonCount?: number,
    onQueryResultChange?: (result: QueryTypeResult) => void,
    enableMultipleSelection?: boolean | ((item?: Record<string, SqlValue>) => boolean),
    selectedRows?: Array<string | number>,
    onClickOutside?: () => void,
    onMultipleSelectionChange?: (params: {
        type: 'add' | 'remove' | 'addAll' | 'removeAll',
        value?: string | number,
        selectedRows: Array<string | number>
    }) => void,
    visibleColumns?: Record<string, boolean>,
    cellStyleMapper?: (props: {
        cellValue: string | number | null  | undefined,
        rowIndex: number,
        rowData: Record<string, unknown>,
        columnName: string,
        gridData: Array<Record<string, unknown>>,
        initialStyle : CSSProperties
    }) => CSSProperties,
    cardContainerStyleMapper?: (props:{cardView:CardViewType}) => CSSProperties,
    onQueryParamChange?:(queryParam:QueryTypeParam) =>void,
    queryParam?:QueryTypeParam
}>(function QueryGrid(props, ref) {
    const referenceRef = useForwardedRef<HTMLDivElement>(ref);
    const {
        query,
        style,
        columnsConfig,
        onFocusedRowChange,
        container,
        refreshQueryKey,
        onRowDoubleClick,
        filterable,
        sortable,
        pageable,
        itemToKey,
        paginationButtonCount,
        onQueryResultChange,
        enableMultipleSelection,
        selectedRows,
        onMultipleSelectionChange,
        onClickOutside,
        visibleColumns,
        cellStyleMapper,
        cardContainerStyleMapper,
        onQueryParamChange,
        queryParam
    } = props;

    const rowPerPage = pageable ? props.rowPerPage ? props.rowPerPage : DEFAULT_ROW_PER_PAGE : Number.MAX_SAFE_INTEGER
    const [queryResult, setQueryResult] = useState<QueryTypeResult>({
        columns: [],
        data: [],
        currentPage: 1,
        error: '',
        totalPage: 1
    });

    const [focusedRow, setFocusedRow] = useState(props.focusedRow);
    useEffect(() => setFocusedRow(props.focusedRow), [props.focusedRow]);
    const propsRef = useRef({onQueryResultChange, refreshGrid:() => {},queryParam : queryParam ?? {params:{},page:0,filter:{},sort:[],rowPerPage:rowPerPage}});
    const refreshGrid = useCallback(function refreshGrid() {
        if (query) {
            (async () => {
                const result = await query(propsRef.current.queryParam);
                setQueryResult(oldVal => {
                    if (result && result.columns && result.columns.length === 0 && oldVal && oldVal.columns && oldVal.columns.length && oldVal.columns.length > 0) {
                        result.columns = oldVal.columns;
                    }
                    if (result) {
                        return result
                    }
                    return oldVal;
                });
            })();
        }
    }, [query]);

    propsRef.current.onQueryResultChange = onQueryResultChange;
    propsRef.current.refreshGrid = refreshGrid;

    useEffect(refreshGrid, [refreshGrid, refreshQueryKey]);
    const containerId = container?.id;
    useEffect(() => {
        const queryGridCols = queryGridColumnsTemporalColumnsSignal.get();
        queryGridCols[containerId] = queryResult.columns ?? [];
        queryGridColumnsTemporalColumnsSignal.set({...queryGridCols});
    }, [queryResult, containerId]);

    useEffect(() => {
        if (propsRef.current.onQueryResultChange) {
            propsRef.current.onQueryResultChange(queryResult);
        }
    }, [queryResult]);
    const dataIsNotEmpty = ((queryResult.data ?? []) as Array<Record<string, SqlValue>>).length > 0;
    return <DivWithClickOutside ref={referenceRef}
                                onClickOutside={onClickOutside}
                                style={{
                                    overflow: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flexGrow: 1,
                                    ...style
                                }}>
        <div style={{display: 'flex', flexDirection: 'column', overflow: 'auto', flexGrow: 1}}>
            <SimpleTable columns={queryResult.columns}
                         visibleColumns={visibleColumns}
                         data={queryResult.data as Array<Record<string, SqlValue>>}
                         itemToKey={itemToKey}
                         columnsConfig={columnsConfig}
                         focusedRow={focusedRow}
                         cardContainerStyleMapper={cardContainerStyleMapper}
                         onFocusedRowChange={(value: Record<string, SqlValue>) => {
                             const data = queryResult.data ?? [];
                             if (onFocusedRowChange) {
                                 onFocusedRowChange({
                                     value,
                                     index: data.indexOf(value),
                                     totalPage: queryResult.totalPage ?? 0,
                                     data,
                                     currentPage: queryResult.currentPage ?? 1
                                 })
                             } else {
                                 setFocusedRow(value);
                             }
                         }}
                         filterable={filterable}
                         filter={propsRef.current.queryParam.filter}
                         onFilterChange={({column, value}) => {
                             const oldValue = propsRef.current.queryParam.filter;
                             const newValue = {...oldValue};
                             newValue[column] = value as SqlValue
                             propsRef.current.queryParam.filter = newValue;
                             propsRef.current.queryParam.page = 0;
                             refreshGrid()
                         }}
                         sortable={sortable}
                         sort={propsRef.current.queryParam.sort}
                         onSortChange={({column, value}) => {
                             const oldValue = propsRef.current.queryParam.sort ?? [];
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
                             propsRef.current.queryParam.sort = newValue;
                         }}
                         onRowDoubleClick={(value) => {
                             if (onRowDoubleClick) {
                                 const data = queryResult.data ?? [];
                                 onRowDoubleClick({
                                     data,
                                     value,
                                     currentPage: queryResult.currentPage ?? 1,
                                     totalPage: queryResult.totalPage ?? 0,
                                     index: data.indexOf(value),
                                     refresh: () => propsRef.current.refreshGrid()
                                 });
                             }
                         }}
                         enableMultipleSelection={enableMultipleSelection}
                         selectedRows={selectedRows}
                         onMultipleSelectionChange={onMultipleSelectionChange}
                         cellStyleMapper={cellStyleMapper}

            />
        </div>
        {pageable && dataIsNotEmpty &&
            <SimpleTableFooter totalPages={queryResult.totalPage ?? 1} value={queryResult.currentPage ?? 1}
                               buttonCount={paginationButtonCount}
                               onChange={async (newPage) => {
                                   propsRef.current.queryParam.page = newPage;
                                   if(onQueryParamChange){
                                       onQueryParamChange({...propsRef.current.queryParam})
                                   }
                                   const result = await query(propsRef.current.queryParam);
                                   setQueryResult(oldVal => {
                                       if (result.columns?.length === 0 && oldVal.columns?.length && oldVal.columns?.length > 0) {
                                           result.columns = oldVal.columns;
                                       }
                                       return result
                                   });
                               }}/>
        }
    </DivWithClickOutside>
})
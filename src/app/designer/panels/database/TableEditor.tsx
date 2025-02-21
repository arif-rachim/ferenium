import {Table} from "./getTables.ts";
import {
    CSSProperties,
    Dispatch,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {SqlValue} from "sql.js";
import {Button} from "../../../button/Button.tsx";
import {BORDER} from "../../../../core/style/Border.ts";
import {colors} from "../../../../core/style/colors.ts";
import CollapsibleLabelContainer from "../../../../core/components/CollapsibleLabelContainer.tsx";
import {composeTableSchema, dbSchemaInitialization} from "../../variable-initialization/dbSchemaInitialization.ts";
import {Editor} from "@monaco-editor/react";
import {isEmpty} from "../../../../core/utils/isEmpty.ts";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {PageViewer} from "../../../viewer/PageViewer.tsx";
import {QueryTypeResult} from "../../../data/QueryGrid.tsx";
import {MdArrowDownward, MdArrowUpward, MdDone, MdDoneAll} from "react-icons/md";
import {queryPagination} from "../../queryPagination.ts";
import {QueryParamsObject} from "./queryDb.ts";
import {guid} from "../../../../core/utils/guid.ts";
import {
    AppVariableInitializationContext,
    FormulaDependencyParameter
} from "../../variable-initialization/AppVariableInitialization.tsx";
import {PageVariableInitializationContext} from "../../variable-initialization/PageVariableInitialization.tsx";
import {utils} from "../../../../core/utils/utils.ts";
import {createLogger} from "../../../../core/utils/logger.ts";
import {isPromise} from "../../../../core/utils/isPromise.ts";
import {notifiable, useSignal} from "react-hook-signal";

async function queryTable(props: {
    table: Table,
    currentPage: number,
    setTableData: Dispatch<SetStateAction<QueryTypeResult>>,
    filter: QueryParamsObject,
    sort: Array<{ column: string, direction: 'asc' | 'desc' }>
}) {
    const {setTableData, table, currentPage, filter, sort} = props;
    // const sortStrings: string[] = [];
    // sort.forEach(s => {
    //     sortStrings.push(`${s.column} ${s.direction}`);
    // })
    // const result = await queryPagination({
    //     currentPage,
    //     pageSize: 50,
    //     query: `SELECT * FROM ${table.tblName} ${sortStrings.length > 0 ? 'ORDER BY':''} ${sortStrings.join(', ')}`,
    //     params: {},
    //     filter: filter,
    //     sort
    // });
    const result = await queryPagination({
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

const db = dbSchemaInitialization();

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


export function SimpleTableFooter(props: {
    totalPages: number,
    value: number,
    onChange: (value: number) => void,
    buttonCount?: number
}) {
    const {totalPages, value, onChange, buttonCount} = props;
    const maxButtons = buttonCount ? buttonCount : 7;
    const halfRange = Math.floor(maxButtons / 2);
    let startPage = Math.max(value - halfRange, 1);
    const endPage = Math.min(startPage + maxButtons - 1, totalPages);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(endPage - maxButtons + 1, 1);
    }

    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return <div
        style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', borderTop: BORDER, padding: 5}}>
        <Button style={{
            padding: 0,
            paddingBottom: 2,
            width: 50,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            background: 'white',
            border: 'unset'
        }} onClick={() => onChange(value - 1)}
                disabled={value === 1}
        >Prev
        </Button>
        {pages.map(page => {
            const isSelected = page === value;
            return <Button style={{
                padding: 0,
                paddingBottom: 2,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : '#666',
                background: isSelected ? colors.blue : 'white',
                border: 'unset'
            }} key={page}
                           onClick={() => onChange(page)}
            >{page}</Button>
        })}
        <Button style={{
            padding: 0,
            paddingBottom: 2,
            width: 50,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            background: 'white',
            border: 'unset'

        }} onClick={() => onChange(value + 1)}
                disabled={value === totalPages}
        >Next
        </Button>
    </div>
}

export type ColumnsConfig = Record<string, {
    hidden?: boolean,
    minWidth?: CSSProperties["minWidth"],
    maxWidth?: CSSProperties["maxWidth"],
    rendererPageId?: string,
    rendererPageDataMapperFormula?: string,
    cellValueMapper?: string,
    title?: string,
    index?: number
}>


function extractWidthAndHiddenField(columnsConfig: ColumnsConfig | undefined, col: string) {


    let minWidth: CSSProperties['minWidth'] | undefined = undefined;
    let maxWidth: CSSProperties['maxWidth'] | undefined = undefined;
    let hide: boolean | undefined = false;
    if (columnsConfig !== undefined && columnsConfig !== null && typeof columnsConfig === 'object' && col in columnsConfig) {
        const config = columnsConfig[col];
        if (!isEmpty(config.minWidth)) {
            {
                minWidth = config.minWidth;
            }
        }
        if (!isEmpty(config.maxWidth)) {
            {
                maxWidth = config.maxWidth;
            }
        }
        if (config.hidden !== undefined) {
            hide = config.hidden;
        }
    }
    return {minWidth, maxWidth, hide};
}

const defaultItemToKey = (item: unknown) => {
    if (item !== null && item !== undefined && typeof item === 'object' && 'ID_' in item) {
        return item?.ID_
    }
    return undefined;
}

function ThreeStateCheckbox(props: {
    value: 'all' | 'some' | 'none',
    disabled?: boolean
}) {
    return <div style={{
        width: 16,
        height: 16,
        marginLeft: 6,
        marginTop: 3,
        border: `1px solid ${props.value === 'none' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0'}`,
        background: props.disabled ? '#CCC' : props.value === 'none' ? 'white' : 'unset',
        borderRadius: 3,
        textAlign: 'center',

    }}>
        {props.value === 'some' &&
            <MdDone
                style={{fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: -3, marginLeft: -3}}/>}
        {props.value === 'all' &&
            <MdDoneAll
                style={{fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: -3, marginLeft: -3}}/>}
    </div>
}

export function SimpleTable<T extends Record<string, SqlValue>>(props: {
    columns: Array<string>,
    data: Array<T>,
    itemToKey?: (item: T) => string | number,
    onFocusedRowChange?: (focusedItem: T) => void,
    focusedRow?: T,
    columnsConfig?: ColumnsConfig,
    filterable?: boolean,
    filter?: QueryParamsObject,
    onFilterChange?: (props: { column: string, value: unknown, oldValue: unknown }) => void,
    sortable?: boolean,
    sort?: Array<{ column: string, direction: 'asc' | 'desc' }>,
    onSortChange?: (props: { column: string, value: 'asc' | 'desc' | 'remove' }) => void,
    onRowDoubleClick?: (value: Record<string, SqlValue>) => void,
    enableMultipleSelection?: (boolean | ((param?: T) => boolean)),
    selectedRows?: Array<string | number>,
    onMultipleSelectionChange?: (params: {
        type: 'add' | 'remove' | 'addAll' | 'removeAll',
        value?: string | number,
        selectedRows: Array<string | number>
    }) => void
}) {
    const {
        columns: columnsProps,
        data,
        focusedRow: focusedRowProps,
        onFocusedRowChange,
        columnsConfig,
        filterable,
        filter,
        onFilterChange,
        sort,
        onSortChange,
        sortable,
        onRowDoubleClick,
        itemToKey,
        enableMultipleSelection,
        selectedRows,
        onMultipleSelectionChange,
    } = props;
    const hasMultipleSelection = typeof enableMultipleSelection === 'function' ? true : enableMultipleSelection === true;
    const keyMapper = itemToKey ?? defaultItemToKey;
    const dataIsEmpty = (data ?? []).length === 0;
    const [focusedRow, setFocusedRow] = useState<T | undefined>(focusedRowProps);
    useEffect(() => setFocusedRow(focusedRowProps), [focusedRowProps]);
    const {allPagesSignal, elements, applicationSignal, navigate} = useAppContext();
    const appSignal = useContext(AppVariableInitializationContext);
    const pageSignal = useContext(PageVariableInitializationContext);
    const columns = useMemo(() => {
        return ((columnsProps ?? []).map((col, index) => {
            if (columnsConfig && col in columnsConfig && columnsConfig[col]) {
                return {col, index: columnsConfig[col].index}
            }
            return {col, index}
        }) as Array<{ col: string, index: number }>).sort((a, b) => (a.index - b.index)).map(i => i.col);
    }, [columnsProps, columnsConfig]);

    const selectedRowsSignal = useSignal<Array<string | number>>(selectedRows ?? []);
    const multipleSelectionType = useSignal<'all' | 'some' | 'none'>("none");
    const propsRef = useRef({dataKeys:[], keyMapper, multipleSelectionType, selectedRowsSignal});
    const {dataKeys, restrictedKeys} = useMemo(() => {
        return data.reduce((result, item, index) => {
            const keyMapper = propsRef.current.keyMapper;
            const key = keyMapper(item) ? keyMapper(item) : index;
            if (typeof enableMultipleSelection === 'function' && !enableMultipleSelection(item)) {
                result.restrictedKeys.push(key)
            } else {
                result.dataKeys.push(key)
            }
            return result;
        }, {dataKeys: [], restrictedKeys: []})
    }, [data, enableMultipleSelection]);

    const restrictedKeysSignal = useSignal(restrictedKeys);
    useEffect(() => {
        restrictedKeysSignal.set(restrictedKeys);
    }, [restrictedKeys,restrictedKeysSignal]);

    propsRef.current = {dataKeys, keyMapper, multipleSelectionType, selectedRowsSignal};
    useEffect(() => {
        const {multipleSelectionType, selectedRowsSignal} = propsRef.current;
        const selectedRows = selectedRowsSignal.get();
        const filteredRows = selectedRows.filter(i => dataKeys.includes(i));
        const allSelected = filteredRows.length === dataKeys.length;
        const noneSelected = filteredRows.length === 0;
        multipleSelectionType.set(noneSelected ? 'none' : allSelected ? 'all' : 'some');
    }, [dataKeys]);

    const selectedRowsString = JSON.stringify(selectedRows ?? []);

    useEffect(() => {
        const {multipleSelectionType, selectedRowsSignal,dataKeys} = propsRef.current;
        const selectedRows = JSON.parse(selectedRowsString);
        selectedRowsSignal.set(selectedRows);
        const filteredRows = selectedRows.filter(i => dataKeys.includes(i));
        const allSelected = filteredRows.length === dataKeys.length;
        const noneSelected = filteredRows.length === 0;
        multipleSelectionType.set(noneSelected ? 'none' : allSelected ? 'all' : 'some');
    }, [selectedRowsString]);

    return <>
        <div style={{display: 'table', maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden'}}>
            <div style={{display: 'table-row', position: 'sticky', top: 0}}>
                {hasMultipleSelection && <notifiable.div style={{
                    display: 'table-cell',
                    borderBottom: BORDER,
                    background: '#F2F2F2',
                    color: "black",
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    width: 30,
                    minWidth: 30,
                    maxWidth: 30,
                }} onClick={() => {
                    const multipleSelection = multipleSelectionType.get();
                    let nextSelection = 'all';
                    const selectedRows = selectedRowsSignal.get()

                    if (multipleSelection === 'all') {
                        nextSelection = 'none';
                        selectedRowsSignal.set(selectedRows.filter(i => !dataKeys.includes(i)));
                        if (onMultipleSelectionChange) {
                            onMultipleSelectionChange({selectedRows: selectedRowsSignal.get(), type: 'removeAll'});
                        }
                    } else {
                        const missingRows = dataKeys.filter(i => !selectedRows.includes(i));
                        selectedRowsSignal.set([...selectedRows, ...missingRows]);
                        if (onMultipleSelectionChange) {
                            onMultipleSelectionChange({selectedRows: selectedRowsSignal.get(), type: 'addAll'});
                        }
                    }
                    multipleSelectionType.set(nextSelection as 'all');

                }}>{() => {
                    const multipleSelection = multipleSelectionType.get();
                    return <ThreeStateCheckbox value={multipleSelection}/>
                }}</notifiable.div>}
                {columns.map(col => {
                    const {minWidth, maxWidth, hide} = extractWidthAndHiddenField(columnsConfig, col);
                    let title = col;
                    if (columnsConfig && typeof columnsConfig === 'object' && col in columnsConfig) {
                        const config = columnsConfig[col];
                        if (config.title) {
                            title = config.title;
                        }
                    }
                    let sortDirection: 'asc' | 'desc' | undefined = undefined;
                    let sortIndex = -1;
                    if (sortable && sort) {
                        sortIndex = sort.findIndex(s => s.column === col);
                        if (sortIndex >= 0) {
                            sortDirection = sort[sortIndex].direction;
                        }
                    }
                    return <div style={{
                        display: hide ? 'none' : 'table-cell',
                        borderBottom: BORDER,
                        background: '#F2F2F2',
                        color: "black",
                        padding: '2px 0px 2px 10px',
                        minWidth,
                        maxWidth,
                        width: minWidth === maxWidth ? maxWidth : 'unset'
                    }} onClick={() => {
                        if (onSortChange === undefined) {
                            return;
                        }
                        if (sortDirection === 'asc') {
                            onSortChange({value: 'desc', column: col});
                        } else if (sortDirection === 'desc') {
                            onSortChange({value: 'remove', column: col});
                        } else {
                            onSortChange({value: 'asc', column: col});
                        }
                    }} key={col}>
                        <div style={{display: 'flex', justifyContent: 'center', gap: 5}}>
                            <div title={title} style={{
                                width: '100%',
                                fontSize: 'smaller',
                                fontWeight: 'bold',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden'
                            }}>
                                {title}
                            </div>
                            {sortable && sortIndex >= 0 &&
                                <div>{(sortIndex + 1).toString()}</div>
                            }
                            {sortable &&
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    {sortDirection === 'asc' &&
                                        <MdArrowUpward/>
                                    }
                                    {sortDirection === 'desc' &&
                                        <MdArrowDownward/>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                })}
            </div>
            {filterable &&
                <div style={{display: 'table-row', position: 'sticky', top: 26}}>
                    {hasMultipleSelection && <div style={{
                        display: 'table-cell',
                        borderBottom: BORDER,
                        background: '#F2F2F2',
                        color: "black",
                    }}></div>}
                    {columns.map((col, index, source) => {
                        const lastIndex = (source.length - 1) === index
                        const {minWidth, maxWidth, hide} = extractWidthAndHiddenField(columnsConfig, col);
                        let value = '';
                        if (filter && col in filter) {
                            const val = filter[col];
                            if (typeof val === 'string') {
                                value = val;
                            } else {
                                value = JSON.stringify(val ?? '');
                            }
                        }
                        return <div style={{
                            display: hide ? 'none' : 'table-cell',
                            borderBottom: BORDER,
                            background: '#F2F2F2',
                            color: "black",
                            minWidth,
                            maxWidth
                        }} key={`filter-${col}`}><input style={{
                            border: 'unset',
                            borderRight: lastIndex ? 'unset' : BORDER,
                            width: '100%',
                            padding: '5px 10px'
                        }} value={value} onChange={(e) => {
                            const val = e.target.value;
                            if (onFilterChange) {
                                onFilterChange({
                                    column: col,
                                    value: val,
                                    oldValue: value
                                });
                            }
                        }} autoComplete={guid()}/></div>
                    })}
                </div>
            }
            {data.map((item, rowIndex) => {
                const key = keyMapper(item) ? keyMapper(item) : rowIndex;
                const focusedKey = focusedRow && keyMapper(focusedRow) ? keyMapper(focusedRow) : -1;
                const isFocused = key === focusedKey;
                return <div style={{display: 'table-row', background: isFocused ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0)'}}
                            key={`${key}`} onClick={() => {
                    if (onFocusedRowChange) {
                        onFocusedRowChange(item)
                    } else {
                        setFocusedRow(item)
                    }
                }} onDoubleClick={() => {
                    if (onRowDoubleClick) {
                        onRowDoubleClick(item)
                    }
                }}>
                    {hasMultipleSelection && <notifiable.div style={{
                        display: 'table-cell',
                        borderBottom: BORDER,
                        background: '#F2F2F2',
                        color: "black",
                        textAlign: 'center',
                    }} onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (restrictedKeys.includes(key)) {
                            return;
                        }
                        const selectedRows = selectedRowsSignal.get();
                        const selected = selectedRows.includes(key);
                        if (selected) {

                            const newSelection = selectedRows.filter(i => i !== key);
                            selectedRowsSignal.set(newSelection);
                            const noneSelected = dataKeys.filter(i => newSelection.includes(i)).length === 0
                            multipleSelectionType.set(noneSelected ? 'none' : 'some');
                            if (onMultipleSelectionChange) {
                                onMultipleSelectionChange({
                                    selectedRows: selectedRowsSignal.get(),
                                    type: 'remove',
                                    value: key
                                });
                            }
                        } else {
                            const newSelection = [...selectedRows, key];
                            selectedRowsSignal.set(newSelection);
                            const allSelected = dataKeys.filter(i => newSelection.includes(i)).length === dataKeys.length;
                            multipleSelectionType.set(allSelected ? 'all' : 'some');
                            if (onMultipleSelectionChange) {
                                onMultipleSelectionChange({
                                    selectedRows: selectedRowsSignal.get(),
                                    type: 'add',
                                    value: key
                                });
                            }
                        }
                    }}>{() => {
                        const selected = selectedRowsSignal.get().includes(key);
                        const disabled = restrictedKeysSignal.get().includes(key)
                        return <ThreeStateCheckbox value={selected ? 'some' : 'none'} disabled={disabled}/>
                    }}</notifiable.div>}
                    {columns.map((col, colIndex) => {
                        let rendererPageId: string | undefined = undefined;
                        const value = item[col] as ReactNode;
                        let mappedValue: ReactNode | Promise<ReactNode> | undefined = value;
                        let valueParams = {value};
                        const lastIndex = colIndex === (columns.length - 1);
                        const {minWidth, maxWidth, hide} = extractWidthAndHiddenField(columnsConfig, col);
                        if (columnsConfig !== undefined && columnsConfig !== null && typeof columnsConfig === 'object' && col in columnsConfig) {
                            const config = columnsConfig[col];
                            const app: FormulaDependencyParameter | undefined = appSignal ? appSignal.get() : undefined;
                            const page: FormulaDependencyParameter | undefined = pageSignal ? pageSignal.get() : undefined;
                            if (config.cellValueMapper) {
                                const log = createLogger(`TableEditor:${col}:cellValueMapper`);
                                try {
                                    const fun = new Function('module', 'app', 'page', 'utils', 'log', 'db', config.cellValueMapper)
                                    const module: {
                                        exports: (props: unknown) => unknown
                                    } = {};

                                    fun.call(null, module, app, page, utils, log, db)

                                    mappedValue = module.exports({
                                        cellValue: value,
                                        rowIndex,
                                        rowData: item,
                                        columnName: col,
                                        gridData: data
                                    }) as Promise<ReactNode>;

                                } catch (err) {
                                    log.error(err);
                                }
                            }

                            if (config.rendererPageId) {
                                rendererPageId = config.rendererPageId;
                            }
                            if (config.rendererPageDataMapperFormula) {
                                const log = createLogger(`TableEditor:${col}:rendererMapper`);
                                try {
                                    const fun = new Function('module', 'app', 'page', 'utils', 'log', 'db', config.rendererPageDataMapperFormula)
                                    const module: {
                                        exports: (props: unknown) => unknown
                                    } = {};

                                    fun.call(null, module, app, page, utils, log, db)
                                    valueParams = module.exports({
                                        cellValue: value,
                                        rowIndex,
                                        rowData: item,
                                        columnName: col,
                                        gridData: data
                                    }) as unknown as typeof valueParams;
                                } catch (err) {
                                    log.error(err);
                                }
                            }
                        }
                        let renderer = <CellRenderer value={mappedValue}/>;
                        if (rendererPageId) {
                            const page = allPagesSignal.get().find(p => p.id === rendererPageId);

                            if (page) {
                                renderer = <PageViewer
                                    elements={elements}
                                    page={page!}
                                    appConfig={applicationSignal.get()}
                                    value={valueParams}
                                    navigate={navigate}
                                />
                            }
                        }
                        return <div style={{
                            display: hide ? 'none' : 'table-cell',
                            verticalAlign: 'middle',
                            borderBottom: BORDER,
                            borderRight: lastIndex ? 'unset' : BORDER,
                            overflow: 'hidden',
                            minWidth,
                            maxWidth
                        }} key={`${colIndex}:${rowIndex}`}>
                            <div style={{minHeight: 22, display: 'flex', flexDirection: 'column'}}>{renderer}</div>
                        </div>
                    })}
                </div>
            })}

        </div>
        {dataIsEmpty &&
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontStyle: 'italic',
                padding: '5px 10px'
            }}>
                {'There is no information to show in this table right now.'}
            </div>}</>
}

function CellRenderer(props: { value: ReactNode | Promise<ReactNode> }) {
    const {value: propsValue} = props;
    const [value, setValue] = useState(() => {
        if (isPromise(props.value)) {
            return '';
        }
        return props.value;
    });
    useEffect(() => {
        if (isPromise(propsValue)) {
            propsValue.then(next => {
                setValue(prev => {
                    if (prev !== next) {
                        return next;
                    }
                    return prev;
                })
            });
        } else {
            setValue(prev => {
                if (prev !== propsValue) {
                    return propsValue;
                }
                return prev;
            });
        }
    }, [propsValue]);

    return <div style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0px 10px'}}
                title={value?.toString()} dangerouslySetInnerHTML={{__html: utils.toString(value) ?? ''}}/>
}
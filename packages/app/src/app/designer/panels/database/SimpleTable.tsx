import {SqlValue} from "sql.js";
import {QueryParamsObject} from "./queryDb.ts";
import {
    Attributes,
    CSSProperties,
    Dispatch,
    PropsWithChildren,
    ReactNode,
    SetStateAction,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {useModalBox} from "../../variable-initialization/useModalBox.tsx";
import {useNavigatePanel} from "../../../../core/hooks/useNavigatePanel.ts";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {
    AppVariableInitializationContext,
    FormulaDependencyParameter
} from "../../variable-initialization/AppVariableInitialization.tsx";
import {PageVariableInitializationContext} from "../../variable-initialization/PageVariableInitialization.tsx";
import {notifiable, useSignal} from "react-hook-signal";
import {BORDER} from "../../../../core/style/Border.ts";
import {MdArrowDownward, MdArrowUpward, MdDone, MdDoneAll} from "react-icons/md";
import {TextInput} from "../../../form/input/text/TextInput.tsx";
import {createLogger, wrapWithLog} from "../../../../core/utils/logger.ts";
import {utils} from "../../../../core/utils/utils.ts";
import {PageViewer} from "../../../viewer/PageViewer.tsx";
import {isEmpty} from "../../../../core/utils/isEmpty.ts";
import {dbSchemaInitialization} from "../../variable-initialization/dbSchemaInitialization.ts";
import {isPromise} from "../../../../core/utils/isPromise.ts";
import {Signal} from "signal-polyfill";
import {CARD_COLUMNS, CardViewType, COLUMNS_WIDTH} from "../../editor/ConfigPropertyEditor.tsx";
import {isNotEmpty} from "../../../../core/utils/isNotEmpty.ts";
import {IoMdMenu} from "react-icons/io";

const db = dbSchemaInitialization();
const log = createLogger('table-cell-error');


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


function FilterHeaderRow(props: {
    cardView?: CardViewType,
    hasMultipleSelection: boolean,
    visible?: boolean,
    columns: string[],
    filter?: QueryParamsObject,
    columnsConfig?: ColumnsConfig,
    onFilterChange?: ((props: {
        column: string;
        value: unknown;
        oldValue: unknown
    }) => void)
}) {
    const {columns, filter, onFilterChange, hasMultipleSelection, visible, columnsConfig, cardView} = props;
    if (visible === false) {
        return <></>
    }

    function onTextInputChange(props: { column: string, oldValue: unknown }) {
        return (e: unknown) => {
            if (onFilterChange) {
                onFilterChange({
                    column: props.column,
                    value: e,
                    oldValue: props.oldValue
                });
            }
        }
    }

    const [showMenu, setShowMenu] = useState(true);
    return <tr>
        {isEmpty(cardView) && hasMultipleSelection && <td style={{
            //borderBottom: BORDER,
            background: '#F2F2F2',
            color: "black",
            minWidth: 0
        }}></td>}
        <Visible when={isNotEmpty(cardView)}>
            <td colSpan={columns.length} style={{
                //borderBottom: BORDER,
                background: '#F2F2F2',
                color: "black"
            }}>
                <div
                    style={{display: 'flex', flexWrap: 'wrap', position: 'relative', paddingTop: 10, paddingBottom: 5}}>

                    {showMenu && columns.map((col, index) => {
                        const value = utils.toString(filter && col in filter ? filter[col] : '');
                        const minWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].minWidth : undefined;
                        const maxWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].maxWidth : undefined;
                        const title = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) && isNotEmpty(columnsConfig[col].title) ? columnsConfig[col].title : col;
                        return <TextInput key={`filter-${col}`} allCaps={false} label={title} style={{
                            border: 'unset',
                            flexGrow: 1,
                            padding: '3px 5px',
                            minWidth: minWidth ? minWidth : '25px',
                            maxWidth
                        }} autoFocus={index === 0} value={value}
                                          onChange={onTextInputChange({column: col, oldValue: value})}/>
                    })}
                    <div style={{position: 'absolute', top: -2, right: 5}} onClick={() => setShowMenu(!showMenu)}>
                        <IoMdMenu style={{fontSize:20}} />
                    </div>
                </div>
            </td>
        </Visible>
        <Visible when={isEmpty(cardView)}>
            {columns.map((col, index) => {
                const value = utils.toString(filter && col in filter ? filter[col] : '');
                const minWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].minWidth : undefined;
                const maxWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].maxWidth : undefined;
                return <td style={{
                    //borderBottom: BORDER,
                    //borderRight: lastIndex ? 'unset' : BORDER,
                    background: '#F2F2F2',
                    color: "black",
                    minWidth: minWidth ? minWidth : '0px',
                    maxWidth
                }} key={`filter-${col}`}>
                    <TextInput allCaps={false} inputStyle={{borderRadius:0}} style={{
                        border: 'unset',
                        width: '100%',
                        padding: '0px 0px',
                        minWidth: 0
                    }} autoFocus={index === 0} value={value}
                               onChange={onTextInputChange({column: col, oldValue: value})}/>
                </td>
            })}
        </Visible>
    </tr>
}

function TitleHeaderRow(props: {
    hasMultipleSelection: boolean,
    multipleSelectionType: Signal.State<"all" | "some" | "none">,
    selectedRowsSignal: Signal.State<Array<string | number>>,
    dataKeys: Array<string | number>,
    onMultipleSelectionChange?: (params: {
        type: "add" | "remove" | "addAll" | "removeAll";
        value?: string | number;
        selectedRows: Array<string | number>
    }) => void,
    columns: string[],
    columnsConfig?: ColumnsConfig,
    sortable?: boolean,
    sort?: Array<{
        column: string;
        direction: "asc" | "desc"
    }>,
    onSortChange?: (props: { column: string; value: "asc" | "desc" | "remove" }) => void,
    visible: boolean
}) {
    const {
        columns,
        columnsConfig,
        sortable,
        sort,
        onSortChange,
        onMultipleSelectionChange,
        multipleSelectionType,
        selectedRowsSignal,
        hasMultipleSelection,
        dataKeys,
        visible
    } = props;
    if (!visible) {
        return <></>
    }
    return <tr>
        {hasMultipleSelection && <notifiable.td style={{
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
        }}</notifiable.td>}
        {columns.map((col) => {
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
            const minWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].minWidth : undefined;
            const maxWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? columnsConfig[col].maxWidth : undefined;

            return <td style={{
                //borderBottom: BORDER,
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
            </td>
        })}
    </tr>
}

function CheckboxColumnRenderer(props: {
    restrictedKeys: Array<string | number>,
    itemKey: string | number,
    selectedRowsSignal: Signal.State<Array<string | number>>,
    dataKeys: Array<string | number>,
    multipleSelectionType: Signal.State<"all" | "some" | "none">,
    visible?: boolean,
    onMultipleSelectionChange?: ((params: {
        type: "add" | "remove" | "addAll" | "removeAll";
        value?: string | number;
        selectedRows: Array<string | number>
    }) => void),
    restrictedKeysSignal: Signal.State<Array<string | number>>
}) {
    const {
        dataKeys,
        itemKey,
        restrictedKeys,
        restrictedKeysSignal,
        selectedRowsSignal,
        onMultipleSelectionChange,
        multipleSelectionType,
        visible
    } = props;
    if (visible === false) {
        return <></>
    }
    return <notifiable.td style={{
        borderBottom: BORDER,
        background: '#F2F2F2',
        color: "black",
        textAlign: 'center',
    }} onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (restrictedKeys.includes(itemKey)) {
            return;
        }
        const selectedRows = selectedRowsSignal.get();
        const selected = selectedRows.includes(itemKey);
        if (selected) {
            const newSelection = selectedRows.filter(i => i !== itemKey);
            selectedRowsSignal.set(newSelection);
            const noneSelected = dataKeys.filter(i => newSelection.includes(i)).length === 0
            multipleSelectionType.set(noneSelected ? 'none' : 'some');
            if (onMultipleSelectionChange) {
                onMultipleSelectionChange({
                    selectedRows: selectedRowsSignal.get(),
                    type: 'remove',
                    value: itemKey
                });
            }
        } else {
            const newSelection = [...selectedRows, itemKey];
            selectedRowsSignal.set(newSelection);
            const allSelected = dataKeys.filter(i => newSelection.includes(i)).length === dataKeys.length;
            multipleSelectionType.set(allSelected ? 'all' : 'some');
            if (onMultipleSelectionChange) {
                onMultipleSelectionChange({
                    selectedRows: selectedRowsSignal.get(),
                    type: 'add',
                    value: itemKey
                });
            }
        }
    }}>{() => {
        const selected = selectedRowsSignal.get().includes(itemKey);
        const disabled = restrictedKeysSignal.get().includes(itemKey)
        return <ThreeStateCheckbox value={selected ? 'some' : 'none'} disabled={disabled}/>
    }}</notifiable.td>;
}

type CellColumnRendererProps<T> = {
    wrapWithTd: boolean,
    columnName?: string,
    colIndex?: number,
    filteredColumns?: string[],
    item: T,
    columnsConfig?: ColumnsConfig,
    rowIndex: number,
    data: T[],
    lastRow: boolean,
    cellStyleMapper?: ((props: {
        cellValue: string | number | null | undefined;
        rowIndex: number;
        rowData: Record<string, unknown>;
        columnName: string;
        gridData: Array<Record<string, unknown>>;
        initialStyle: CSSProperties
    }) => CSSProperties)
} & Attributes

function CellColumnRenderer<T extends Record<string, unknown>>(props: CellColumnRendererProps<T>) {
    const {allPagesSignal, elements, applicationSignal, navigate} = useAppContext();
    const navigatePanel = useNavigatePanel();
    const appSignal = useContext(AppVariableInitializationContext);
    const pageSignal = useContext(PageVariableInitializationContext);
    const alertBox = useModalBox();
    const {
        columnName,
        colIndex,
        filteredColumns,
        columnsConfig,
        rowIndex,
        lastRow,
        data,
        cellStyleMapper,
        item,
        wrapWithTd
    } = props;
    let rendererPageId: string | undefined = undefined;
    const value = isNotEmpty(columnName) ? item[columnName] as ReactNode : undefined;
    let mappedValue: ReactNode | Promise<ReactNode> | undefined = value;
    let valueParams = {value};
    const lastIndex = filteredColumns ? colIndex === (filteredColumns.length - 1) : false;

    if (isNotEmpty(columnsConfig) && isNotEmpty(columnName) && columnName in columnsConfig) {
        const config = columnsConfig[columnName];
        const app: FormulaDependencyParameter | undefined = appSignal ? appSignal.get() : undefined;
        const page: FormulaDependencyParameter | undefined = pageSignal ? pageSignal.get() : undefined;
        if (config.cellValueMapper) {
            try {
                const fun = new Function('module', 'app', 'page', 'utils', 'db', 'alertBox', 'navigate', 'navigatePanel', wrapWithLog(config.cellValueMapper))
                const module: {
                    exports: (props: unknown) => unknown
                } = {
                    exports: () => {
                    }
                };

                fun.call(null, module, app, page, utils, db, alertBox, navigate, navigatePanel)

                mappedValue = module.exports({
                    cellValue: value,
                    rowIndex,
                    rowData: item,
                    columnName: columnName,
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
            try {
                const fun = new Function('module', 'app', 'page', 'utils', 'db', 'alertBox', 'navigate', 'navigatePanel', wrapWithLog(config.rendererPageDataMapperFormula))
                const module: { exports: (props: unknown) => unknown } = {
                    exports: () => {
                    }
                };
                fun.call(null, module, app, page, utils, db, alertBox, navigate, navigatePanel)
                valueParams = module.exports({
                    cellValue: value,
                    rowIndex,
                    rowData: item,
                    columnName: columnName,
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
    const minWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnName) && isNotEmpty(columnsConfig[columnName]) ? columnsConfig[columnName].minWidth : undefined;
    const maxWidth = isNotEmpty(columnsConfig) && isNotEmpty(columnName) && isNotEmpty(columnsConfig[columnName]) ? columnsConfig[columnName].maxWidth : undefined;

    const initialStyle = {
        verticalAlign: 'middle',
        borderBottom: lastRow ? BORDER : BORDER,
        borderRight: lastIndex ? 'unset' : BORDER,
        overflow: 'hidden',
        minWidth,
        maxWidth,
    } as CSSProperties
    const cellStyle = cellStyleMapper && columnName ? cellStyleMapper({
        cellValue: value as string,
        rowIndex,
        rowData: item,
        columnName: columnName,
        gridData: data,
        initialStyle: initialStyle
    }) : initialStyle;
    const noBorderCellStyle = (Object.keys(cellStyle) as Array<keyof CSSProperties>).reduce((res,key) => {
        if(['border','borderLeft','borderRight','borderTop','borderBottom'].includes(key)){
            return res;
        }
        res[key] =  cellStyle[key];
        return res;
    },{} as Record<string, unknown>) as CSSProperties
    return wrapWithTd ? (<td style={cellStyle}>
        <div style={{minHeight: 22, display: 'flex', flexDirection: 'column'}}>{renderer}</div>
    </td>) : (<div style={{minHeight: 22, display: 'flex', flexDirection: 'column', ...noBorderCellStyle}}>{renderer}</div>)
}

function ItemRowRenderer<T extends Record<string, SqlValue>>(props: {
    cardView?: CardViewType,
    key: string | number,
    keyMapper: (item: T) => (string | number),
    item: T,
    rowIndex: number,
    focusedRow?: T,
    data: T[],
    onFocusedRowChange?: ((focusedItem: T) => void),
    setFocusedRow: Dispatch<SetStateAction<T | undefined>>,
    onRowDoubleClick?: ((value: Record<string, SqlValue>) => void),
    restrictedKeys: Array<string | number>,
    selectedRowsSignal: Signal.State<Array<string | number>>,
    dataKeys: Array<string | number>,
    multipleSelectionType: Signal.State<"all" | "some" | "none">,
    onMultipleSelectionChange?: ((params: {
        type: "add" | "remove" | "addAll" | "removeAll";
        value?: string | number;
        selectedRows: Array<string | number>
    }) => void),
    restrictedKeysSignal: Signal.State<Array<string | number>>,
    hasMultipleSelection: boolean,
    columns: string[],
    columnsConfig?: ColumnsConfig,
    cellStyleMapper?: ((props: {
        cellValue: string | number | null | undefined;
        rowIndex: number;
        rowData: Record<string, unknown>;
        columnName: string;
        gridData: Array<Record<string, unknown>>;
        initialStyle: CSSProperties
    }) => CSSProperties)
}) {

    const {
        item,
        rowIndex,
        focusedRow,
        setFocusedRow,
        onFocusedRowChange,
        columnsConfig,
        cellStyleMapper,
        keyMapper,
        multipleSelectionType,
        selectedRowsSignal,
        dataKeys,
        onMultipleSelectionChange,
        hasMultipleSelection,
        data,
        columns,
        restrictedKeys,
        restrictedKeysSignal,
        onRowDoubleClick,
        cardView
    } = props;
    const key = keyMapper(item) ? keyMapper(item) : rowIndex;
    const focusedKey = focusedRow && keyMapper(focusedRow) ? keyMapper(focusedRow) : -1;
    const isFocused = key === focusedKey;
    const tableRowStyle = {} as CSSProperties
    if (isFocused) {
        tableRowStyle.background = 'rgba(0,0,0,0.1)'
    }
    const lastRow = rowIndex === data.length - 1;


    function onKeyDown(e: React.KeyboardEvent) {
        const sibling = e.code === 'ArrowUp' ? e.currentTarget.previousElementSibling : e.code === 'ArrowDown' ? e.currentTarget.nextElementSibling : null;
        if (sibling && sibling.classList.contains('table-row')) {
            (sibling as HTMLDivElement).focus();
        }
        if (e.code === 'Enter') {
            if (onFocusedRowChange) {
                onFocusedRowChange(item)
            } else {
                setFocusedRow(item)
            }
        }
    }

    function onClick() {
        if (onFocusedRowChange) {
            onFocusedRowChange(item)
        } else {
            setFocusedRow(item)
        }
    }

    function onDoubleClick() {
        if (onRowDoubleClick) {
            onRowDoubleClick(item)
        }
    }

    if (cardView) {
        return <div className={'table-row card-view'} style={tableRowStyle} key={`${key}`} tabIndex={0} onKeyDown={onKeyDown}
                    onClick={onClick} onDoubleClick={onDoubleClick} >
            <CellColumnRenderer
                wrapWithTd={false}
                columnName={cardView}
                key={`${rowIndex}`}
                item={item}
                columnsConfig={columnsConfig}
                rowIndex={rowIndex}
                data={data}
                lastRow={lastRow}
                cellStyleMapper={cellStyleMapper}/>
        </div>
    }
    return <tr className={'table-row'} style={tableRowStyle} key={`${key}`} tabIndex={0} onKeyDown={onKeyDown}
               onClick={onClick} onDoubleClick={onDoubleClick} >
        <CheckboxColumnRenderer restrictedKeys={restrictedKeys} itemKey={key}
                                selectedRowsSignal={selectedRowsSignal}
                                dataKeys={dataKeys}
                                multipleSelectionType={multipleSelectionType}
                                onMultipleSelectionChange={onMultipleSelectionChange}
                                restrictedKeysSignal={restrictedKeysSignal}
                                visible={hasMultipleSelection}/>
        {/*This is the part where to columns is re-rendering*/}
        {columns.map((columnName, colIndex, filteredColumns) =>
            (<CellColumnRenderer
                wrapWithTd={true}
                key={`${colIndex}:${rowIndex}`}
                columnName={columnName}
                item={item}
                colIndex={colIndex}
                filteredColumns={filteredColumns}
                columnsConfig={columnsConfig}
                rowIndex={rowIndex}
                data={data}
                lastRow={lastRow}
                cellStyleMapper={cellStyleMapper}/>))
        }
    </tr>
}

export function SimpleTable<T extends Record<string, SqlValue>>(props: {
    columns?: Array<string>,
    data?: Array<T>,
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
    }) => void,
    visibleColumns?: Record<string, boolean>,
    cellStyleMapper?: (props: {
        cellValue: string | number | null | undefined,
        rowIndex: number,
        rowData: Record<string, unknown>,
        columnName: string,
        gridData: Array<Record<string, unknown>>,
        initialStyle: CSSProperties
    }) => CSSProperties,
    cardContainerStyleMapper?: (props: {cardView:CardViewType}) => CSSProperties
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
        visibleColumns,
        cellStyleMapper,
        cardContainerStyleMapper
    } = props;

    const hasMultipleSelection = typeof enableMultipleSelection === 'function' ? true : enableMultipleSelection === true;
    const keyMapper = (itemToKey ?? defaultItemToKey) as (item: T) => string | number;
    const dataIsEmpty = (data ?? []).length === 0;
    const [focusedRow, setFocusedRow] = useState<T | undefined>(focusedRowProps);
    useEffect(() => setFocusedRow(focusedRowProps), [focusedRowProps]);
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
    const propsRef = useRef({
        dataKeys: [] as Array<string | number>,
        keyMapper,
        multipleSelectionType,
        selectedRowsSignal
    });
    const {dataKeys, restrictedKeys} = useMemo(() => {
        return (data ?? []).reduce((result, item, index) => {
            const keyMapper = propsRef.current.keyMapper;
            const key = keyMapper(item) ? keyMapper(item) : index;
            if (typeof enableMultipleSelection === 'function' && !enableMultipleSelection(item)) {
                result.restrictedKeys.push(key)
            } else {
                result.dataKeys.push(key)
            }
            return result;
        }, {dataKeys: [] as Array<string | number>, restrictedKeys: [] as Array<string | number>})
    }, [data, enableMultipleSelection]);

    const restrictedKeysSignal = useSignal<Array<string | number>>(restrictedKeys);
    useEffect(() => {
        restrictedKeysSignal.set(restrictedKeys);
    }, [restrictedKeys, restrictedKeysSignal]);

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
        const {multipleSelectionType, selectedRowsSignal, dataKeys} = propsRef.current;
        const selectedRows = JSON.parse(selectedRowsString) as Array<string | number>;
        selectedRowsSignal.set(selectedRows);
        const filteredRows = selectedRows.filter(i => dataKeys.includes(i));
        const allSelected = filteredRows.length === dataKeys.length;
        const noneSelected = filteredRows.length === 0;
        multipleSelectionType.set(noneSelected ? 'none' : allSelected ? 'all' : 'some');
    }, [selectedRowsString]);
    const filteredHiddenColumns = columns.filter(col => {
        const visible = isNotEmpty(columnsConfig) && isNotEmpty(columnsConfig[col]) ? !columnsConfig[col].hidden : true
        if (isNotEmpty(visibleColumns) && col in visibleColumns && isNotEmpty(visibleColumns[col])) {
            return visible && visibleColumns[col];
        }
        return visible;
    });
    const {tableId, cardView} = useGetCardView(columnsConfig);

    const cardContainerStyle = isNotEmpty(cardContainerStyleMapper) && isNotEmpty(cardView) ? cardContainerStyleMapper({cardView}) : {};
    return <table id={tableId} style={{maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden',flexGrow: isNotEmpty(cardView) ? '1' : "unset"}}>
        <thead style={{position: 'sticky', top: 0}}>
        <TitleHeaderRow hasMultipleSelection={hasMultipleSelection} multipleSelectionType={multipleSelectionType}
                        selectedRowsSignal={selectedRowsSignal} dataKeys={dataKeys}
                        onMultipleSelectionChange={onMultipleSelectionChange} columns={filteredHiddenColumns}
                        columnsConfig={columnsConfig} sortable={sortable}
                        sort={sort}
                        onSortChange={onSortChange} visible={isEmpty(cardView)}/>
        <FilterHeaderRow cardView={cardView} hasMultipleSelection={hasMultipleSelection} columns={filteredHiddenColumns}
                         columnsConfig={columnsConfig}
                         filter={filter}
                         onFilterChange={onFilterChange} visible={filterable}/>
        </thead>
        <tbody>
        <Visible when={isNotEmpty(cardView)}>
            <tr>
                <td colSpan={filteredHiddenColumns.length}>
                    <div style={{display: 'flex', flexWrap: 'wrap',...cardContainerStyle}}>
                            {(data ?? []).map((item, rowIndex, data) => {
                                const key = keyMapper(item) ? keyMapper(item) : rowIndex;
                                return <ItemRowRenderer cardView={cardView} key={key} keyMapper={keyMapper} item={item}
                                                        rowIndex={rowIndex}
                                                        focusedRow={focusedRow} data={data}
                                                        onFocusedRowChange={onFocusedRowChange}
                                                        setFocusedRow={setFocusedRow}
                                                        onRowDoubleClick={onRowDoubleClick}
                                                        restrictedKeys={restrictedKeys}
                                                        selectedRowsSignal={selectedRowsSignal}
                                                        dataKeys={dataKeys}
                                                        multipleSelectionType={multipleSelectionType}
                                                        onMultipleSelectionChange={onMultipleSelectionChange}
                                                        restrictedKeysSignal={restrictedKeysSignal}
                                                        hasMultipleSelection={hasMultipleSelection}
                                                        columns={filteredHiddenColumns}
                                                        columnsConfig={columnsConfig}
                                                        cellStyleMapper={cellStyleMapper}/>
                            })}
                    </div>
                </td>
            </tr>
        </Visible>
        <Visible when={isEmpty(cardView)}>
                {(data ?? []).map((item, rowIndex, data) => {
                    const key = keyMapper(item) ? keyMapper(item) : rowIndex;
                    return <ItemRowRenderer cardView={cardView} key={key} keyMapper={keyMapper} item={item}
                                            rowIndex={rowIndex}
                                            focusedRow={focusedRow} data={data} onFocusedRowChange={onFocusedRowChange}
                                            setFocusedRow={setFocusedRow} onRowDoubleClick={onRowDoubleClick}
                                            restrictedKeys={restrictedKeys} selectedRowsSignal={selectedRowsSignal}
                                            dataKeys={dataKeys} multipleSelectionType={multipleSelectionType}
                                            onMultipleSelectionChange={onMultipleSelectionChange}
                                            restrictedKeysSignal={restrictedKeysSignal}
                                            hasMultipleSelection={hasMultipleSelection} columns={filteredHiddenColumns}
                                            columnsConfig={columnsConfig}
                                            cellStyleMapper={cellStyleMapper}/>
                })}
        </Visible>
        </tbody>
        <tfoot>
        <Visible when={dataIsEmpty}>
            <tr style={{
                alignItems: 'center',
                justifyContent: 'center',
                fontStyle: 'italic',
                padding: '5px 10px'
            }}>
                <td colSpan={filteredHiddenColumns.length} style={{textAlign: 'center'}}>
                    {'There is no information to show in this table right now.'}
                </td>
            </tr>
        </Visible>
        </tfoot>
    </table>
}

function useGetCardView(columnsConfig?: ColumnsConfig) {
    const screenSizesKey = useMemo(() => {
        const columnsConfigKeys = Object.keys(columnsConfig ?? {})
        return CARD_COLUMNS.filter(c => {
            if (!columnsConfigKeys.includes(c as string)) {
                return false;
            }
            const config = (columnsConfig ?? {})[c] ?? {};
            if (config.hidden === true) {
                return false;
            }
            const hasNoRenderer = isEmpty(config.cellValueMapper) && isEmpty(config.rendererPageId);
            return !hasNoRenderer;
        }) as Array<CardViewType>;
    }, [columnsConfig]);
    const tableId = useId();
    const [elementWidth, setElementWidth] = useState<number | undefined>();
    useLayoutEffect(() => {
        const element = document.getElementById(tableId)
        if (isNotEmpty(element) && isNotEmpty(element.parentElement)) {
            setElementWidth(Math.round(element.parentElement.getBoundingClientRect().width))
        }
    }, []);
    const timeoutRef = useRef(0)
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const {width} = entry.contentRect;
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setElementWidth(Math.round(width))
                }, 100) as unknown as number
            }
        })
        const element = (document.getElementById(tableId)?.parentElement);
        if (element) {
            observer.observe(element)
        }
        return () => observer.disconnect();
    }, []);

    function getTheCardView(width?: number, cardCols?: Array<CardViewType>): CardViewType | undefined {
        let screenSize = undefined;
        if (isNotEmpty(cardCols)) {
            for (const cardCol of cardCols) {
                if (width && width <= COLUMNS_WIDTH[cardCol]) {
                    screenSize = cardCol;
                }
            }
        }
        return screenSize;
    }

    return {cardView: getTheCardView(elementWidth, screenSizesKey), tableId};
}

export const defaultItemToKey = (item: unknown) => {
    if (isNotEmpty(item) && typeof item === 'object' && 'ID_' in item) {
        return item?.ID_
    }
    return undefined;
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
                        return next as typeof prev;
                    }
                    return prev;
                })
            });
        } else {
            setValue(prev => {
                if (prev !== propsValue) {
                    return propsValue as typeof prev;
                }
                return prev;
            });
        }
    }, [propsValue]);

    return <div style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0px 10px'}}
                dangerouslySetInnerHTML={{__html: utils.toString(value) ?? ''}}/>
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

function Visible(props: PropsWithChildren<{ when: boolean }>) {
    if (props.when) {
        return props.children
    }
    return <></>
}
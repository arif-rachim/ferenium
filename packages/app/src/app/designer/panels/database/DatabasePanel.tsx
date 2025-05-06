import {Button} from "../../../button/Button.tsx";
import {ChangeEvent, useContext, useRef} from "react";
import {Table, TableContext} from "./getTables.ts";
import {notifiable, useSignal} from "react-hook-signal";
import {Icon} from "../../../../core/components/icon/Icon.ts";
import {useAddDashboardPanel} from "../../hooks/useAddDashboardPanel.tsx";
import TableEditor from "./TableEditor.tsx";
import {useSaveSqlLite} from "../../../../core/hooks/useSaveSqlLite.ts";
import {TextInput} from "../../../form/input/text/TextInput.tsx";
import {BORDER} from "../../../../core/style/Border.ts";
import {useShowModal} from "../../../../core/hooks/modal/useShowModal.ts";
import {ConfirmationDialog} from "../../ConfirmationDialog.tsx";
import {SqlValue} from "sql.js";
import {QueryParamsObject} from "./queryDb.ts";
import {arrayToQueryResult} from "../../../../core/utils/arrayToQueryResult.ts";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useDeleteSqlLite} from "../../../../core/hooks/useDeleteSqlLite.ts";
import Visible from "../../../../core/components/Visible.tsx";
import {SimpleTable} from "./SimpleTable.tsx";
import {SimpleTableFooter} from "./SimpleTableFooter.tsx";

export function DatabasePanel() {
    const filterSignal = useSignal<QueryParamsObject>({})
    const pageSignal = useSignal(1);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const tablesSignal = useContext(TableContext)!;
    const addPanel = useAddDashboardPanel();
    const {applicationSignal} = useAppContext();
    const selectedDbSignal = useSignal('all');
    function addSqlLite() {
        if (fileInputRef.current) {
            (fileInputRef.current as HTMLInputElement).click();
        }
    }
    const saveSqlLite = useSaveSqlLite();
    const deleteSqlLite = useDeleteSqlLite();
    const showModal = useShowModal();


    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files === null || files.length === 0) {
            return;
        }
        const file = files && files.length > 0 ? files[0] : undefined;
        const fileName = await showModal<string | boolean>(closePanel => {
            const suggestedName = ((file?.name ?? '').split('.')[0] ?? '').split(' ').map(i => i ? i.trim() : '').filter(i => i.length > 0 || i !== '.').join('_').toLowerCase();
            return <ConfirmationDialog buttons={[{label: 'Save', id: 'Save', type: 'submit'}, {
                label: 'Cancel',
                id: 'Cancel',
                onClick: () => closePanel(false)
            }]} onSubmit={event => {
                event.preventDefault();
                event.stopPropagation();
                const formData = new FormData(event.target as HTMLFormElement);
                const file = formData.get('fileName');
                if (file && typeof file === 'string') {
                    const fileName = file.split(' ').map(i => i ? i.trim() : '').filter(i => i.length > 0 || i !== '.').join('_').toLowerCase();
                    closePanel(fileName);
                }
            }}>
                <div style={{display: 'flex', flexDirection: 'column', padding: '0px 10px'}}>
                    <div style={{padding: 5}}>Please enter the Database name :</div>
                    <TextInput name={'fileName'} required={true} placeholder={suggestedName} allCaps={false}/>
                </div>
            </ConfirmationDialog>
        })
        if (file && typeof fileName === 'string') {
            const arrayBuffer = await file.arrayBuffer();
            try{
                await saveSqlLite(fileName,arrayBuffer);
            }catch (err){
                console.error(err);
            }
        }
    }

    function openDetail(table: Table) {
        addPanel({
            title: `${table.tblName}`,
            Icon: Icon.Database,
            id: `${table.tblName}`,
            tag: {
                type: 'TableEditor',
            },
            component: () => <TableEditor table={table}/>,
            position: 'mainCenter',
        })
    }

    return <div style={{display: 'flex', flexDirection: 'column', overflow: 'auto',flexGrow:1}}>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderBottom: BORDER,
            flexShrink: 0
        }}>
            <div style={{display: 'flex',borderRight:BORDER,padding:5,alignItems:'center'}}>
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        justifyContent: 'center',
                        padding: '0px 10px 2px 10px',
                        background: 'rgba(0,0,0,0.0)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        color: '#333',
                    }}
                    onClick={() => addSqlLite()}
                    icon={'IoIosCloudUpload'}>{''}</Button>

            </div>
            <div style={{display:'flex',alignItems: 'center',gap:5,padding:5,flexGrow:1}}>
                <div>Name : </div>
                <notifiable.select style={{border: BORDER, padding: '3px 5px', borderRadius: 5,flexGrow:1}} value={() => {
                    return selectedDbSignal.get()
                }} onChange={(e) => {
                    const val = e.target.value;
                    selectedDbSignal.set(val);
                    const filter = {...filterSignal.get()};
                    if(val === 'all') {
                        delete filter.fileName
                    }else {
                        filter.fileName = val as SqlValue;
                    }
                    filterSignal.set(filter);
                }}>
                    {() => {
                        const appSignal = applicationSignal.get();
                        if(appSignal && appSignal.databases) {
                            const databases = ['all',...appSignal.databases];
                            return databases.map(d => <option value={d}>{d}</option>)
                        }
                        return []
                    }}
                </notifiable.select>
                <Visible when={() => {
                    return selectedDbSignal.get() !== 'all'
                }} >
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        justifyContent: 'center',
                        padding: '0px 10px 2px 10px',
                        background: 'rgba(0,0,0,0.0)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        color: '#333',
                    }}
                    onClick={async () => {
                        const fileName = selectedDbSignal.get();
                        await deleteSqlLite(fileName)
                    }}
                    icon={'IoMdTrash'}>{''}</Button>
                </Visible>
            </div>


            <input type={'file'}
                   ref={fileInputRef}
                   accept={".sqlite,.db"}
                   style={{padding: 10, display: 'none'}}
                   onChange={handleFileChange}
            />
        </div>
        <notifiable.div style={{display: 'flex', flexDirection: 'column', overflow: 'auto', flexGrow: 1}}>
            {() => {
                const tables = tablesSignal.get() ?? [];
                const filter = filterSignal.get();
                const page = pageSignal.get();
                const result = arrayToQueryResult(tables as unknown as Array<Record<string, SqlValue>>, {
                    filter,
                    rowPerPage: 50,
                    page
                }, ['fileName', 'name']);
                return <>
                    <div style={{display: 'flex', flexDirection: 'column', overflow: 'auto', flexGrow: 1}}>
                        <SimpleTable
                            columns={result.columns ?? []}
                            data={(result.data ?? []) as Array<Record<string, SqlValue>>}
                            filterable={true}
                            columnsConfig={{fileName: {title: 'Name'}, name: {title: 'Table'}}}
                            filter={filter}
                            onFilterChange={async ({column, value}) => {
                                const filter = {...filterSignal.get()};
                                filter[column] = value as SqlValue;
                                filterSignal.set(filter);
                            }}
                            onRowDoubleClick={(value) => {
                                openDetail(value as unknown as Table);
                            }}
                        />
                    </div>
                    <SimpleTableFooter totalPages={result.totalPage ?? 20} value={result.currentPage ?? 1}
                                       onChange={(page) => {
                                           pageSignal.set(page)
                                       }}/>
                </>
            }}
        </notifiable.div>
    </div>
}

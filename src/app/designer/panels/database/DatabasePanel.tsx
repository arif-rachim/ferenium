import {Button} from "../../../button/Button.tsx";
import {ChangeEvent, useRef} from "react";
import {Table} from "./getTables.ts";
import {notifiable, useComputed, useSignal} from "react-hook-signal";
import {Icon} from "../../../../core/components/icon/Icon.ts";
import {useAddDashboardPanel} from "../../hooks/useAddDashboardPanel.tsx";
import TableEditor from "./TableEditor.tsx";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useDeleteSqlLite} from "../../../../core/hooks/useDeleteSqlLite.ts";
import {useSaveSqlLite} from "../../../../core/hooks/useSaveSqlLite.ts";
import {useDownloadSqlLite} from "../../../../core/hooks/useDownloadSqlLite.ts";
import {TextInput} from "../../../form/input/text/TextInput.tsx";
import {BORDER} from "../../../../core/style/Border.ts";

export function DatabasePanel() {
    const focusedItemSignal = useSignal<string>('');
    const filterSignal = useSignal<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const {applicationSignal} = useAppContext();
    const tablesSignal = useComputed<Table[]>(() => {
        return applicationSignal.get().tables;
    });
    const addPanel = useAddDashboardPanel();

    function addSqlLite() {
        if (fileInputRef.current) {
            (fileInputRef.current as HTMLInputElement).click();
        }
    }

    const deleteSqlLite = useDeleteSqlLite();
    const saveSqlLite = useSaveSqlLite();
    const downloadSqlLite = useDownloadSqlLite();

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files === null || files.length === 0) {
            return;
        }
        const file = files && files.length > 0 ? files[0] : undefined;

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            await saveSqlLite(arrayBuffer);
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

    return <div style={{display: 'flex', flexDirection: 'column'}}>
        <div style={{display:'flex',flexDirection:'row',gap:10,padding:10,position:'sticky',top:0,backgroundColor:'white',borderBottom:BORDER}}>
            <div style={{display: 'flex'}}>
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        justifyContent: 'center',
                        padding: '0px 10px 2px 10px',
                        background: 'rgba(0,0,0,0.0)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRight: 'unset',
                        color: '#333',
                    }}
                    onClick={() => addSqlLite()}
                    icon={'IoIosCloudUpload'}>{''}</Button>
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        justifyContent: 'center',
                        padding: '0px 10px 2px 10px',
                        background: 'rgba(0,0,0,0.0)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 0,
                        borderRight: 'unset',
                        color: '#333',
                    }}
                    onClick={() => downloadSqlLite()}
                    icon={'IoMdDownload'}>{''}</Button>
                <Button
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        justifyContent: 'center',
                        padding: '0px 10px 2px 10px',
                        background: 'rgba(0,0,0,0.0)',
                        border: '1px solid rgba(0,0,0,0.2)',
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        color: '#333',
                    }}
                    onClick={() => deleteSqlLite()} icon={'IoMdRemove'}
                >
                    {''}
                </Button>
            </div>
            <input type={'file'}
                   ref={fileInputRef}
                   accept={".sqlite,.db"}
                   style={{padding: 10, display: 'none'}}
                   onChange={handleFileChange}
            />
            <notifiable.div style={{display: 'flex', flexDirection: 'column',flexGrow:1}}>
                {() => {
                    const value = filterSignal.get();
                    return <TextInput type={'text'} value={value} onChange={val => {
                        if (val) {
                            filterSignal.set(val);
                        } else {
                            filterSignal.set('');
                        }
                    }} placeholder={'Search'}/>
                }}
            </notifiable.div>
        </div>


        <notifiable.div style={{display: 'flex', flexDirection: 'column'}}>
            {() => {
                const tables = tablesSignal.get() ?? [];
                const filter = filterSignal.get();
                const focusedItem = focusedItemSignal.get();
                return tables.filter(table => {
                    if (filter) {
                        return table.tblName.indexOf(filter) >= 0
                    }
                    return true;
                }).map(table => {
                    const isFocused = focusedItem === table.tblName;
                    return <div style={{
                        display: 'flex',
                        gap: 5,
                        padding: '0px 10px 2px 10px',
                        background: isFocused ? 'rgba(0,0,0,0.1)' : 'unset'
                    }} key={table.tblName} onClick={() => {
                        focusedItemSignal.set(table.tblName);
                        openDetail(table)
                    }}>
                        <div style={{
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: 'small'
                        }}>{table.tblName}</div>
                    </div>
                })
            }}
        </notifiable.div>
    </div>
}

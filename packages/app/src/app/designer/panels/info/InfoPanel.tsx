import {useSignalEffect} from "react-hook-signal";
import {Info, infoSignal} from "../../../../core/utils/info.ts";
import {useState} from "react";
import {utils} from "../../../../core/utils/utils.ts";

export function InfoPanel() {
    const [info,setInfo] = useState<Info>(infoSignal.get());
    useSignalEffect(() => setInfo(infoSignal.get()))
    return <div style={{
        display: 'table',
        gap: 10,
        padding: 10
    }}>
        <div style={{display:'table-row',gap:5}}>
            <div style={{display:'table-cell',width:80,fontWeight:'bold',textAlign:'right'}}>Database : </div>
            <div style={{display:'table-cell',textAlign:'center'}}>{info.database.type}</div>
        </div>
        <div style={{display:'table-row',gap:5}}>
            <div style={{display:'table-cell',fontWeight:'bold',textAlign:'right'}}>appMeta : </div>
            <div style={{display:'table-cell',textAlign:'center'}}>{info.appMeta.type}</div>
            <div style={{display:'table-cell',textAlign:'center'}}>{(info.appMeta.version ?? 0).toLocaleString()}</div>
            <div style={{display:'table-cell',textAlign:'center'}}>{utils.ddMmmYyyyHhMm(info.appMeta.lastUpdate)}</div>
        </div>
        <div style={{display:'table-row',gap:5}}>
            <div style={{display:'table-cell',fontWeight:'bold',textAlign:'right'}}>appStorage : </div>
            <div style={{display:'table-cell',textAlign:'center'}}>{info.appStorage.type}</div>
            <div style={{display:'table-cell',textAlign:'center'}}>{(info.appStorage.version ?? 0).toLocaleString()}</div>
            <div style={{display:'table-cell',textAlign:'center'}}>{utils.ddMmmYyyyHhMm(info.appStorage.lastUpdate)}</div>
        </div>
    </div>
}

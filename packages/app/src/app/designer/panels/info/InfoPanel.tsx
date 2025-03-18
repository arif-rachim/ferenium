import {useSignalEffect} from "react-hook-signal";
import {Info, infoSignal} from "../../../../core/utils/info.ts";
import {useState} from "react";
import {utils} from "../../../../core/utils/utils.ts";

export function InfoPanel() {
    const [info,setInfo] = useState<Info>(infoSignal.get());
    useSignalEffect(() => setInfo(infoSignal.get()))
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 10
    }}>
        <div style={{display:'flex',gap:5}}>
            <div style={{width:75,flexShrink:0,fontWeight:'bold',textAlign:'right'}}>Database : </div>
            <div style={{width:50,flexShrink:0,textAlign:'center'}}>{info.database.type}</div>
        </div>
        <div style={{display:'flex',gap:5}}>
            <div style={{width:75,flexShrink:0,fontWeight:'bold',textAlign:'right'}}>appMeta : </div>
            <div style={{width:50,flexShrink:0,textAlign:'center'}}>{info.appMeta.type}</div>
            <div style={{width:20,textAlign:'center'}}>{info.appMeta.version}</div>
            <div>{utils.ddMmmYyyy(info.appMeta.lastUpdate)}</div>
        </div>
        <div style={{display:'flex',gap:5}}>
            <div style={{width:75,flexShrink:0,fontWeight:'bold',textAlign:'right'}}>appStorage : </div>
            <div style={{width:50,flexShrink:0,textAlign:'center'}}>{info.appStorage.type}</div>
            <div style={{width:20,textAlign:'center'}}>{info.appStorage.version}</div>
            <div>{utils.ddMmmYyyy(info.appStorage.lastUpdate)}</div>
        </div>
    </div>
}

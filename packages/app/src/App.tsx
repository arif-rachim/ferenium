import AppDesigner, {Application} from "./app/designer/AppDesigner.tsx";
import {useEffect, useState} from "react";
import AppViewer from "./app/viewer/AppViewer.tsx";
import {openDevTools} from "./core/utils/electronApi.ts";
import {saveAppMeta} from "./core/utils/appStorage.ts";

export function App(props:{meta:Record<string, unknown>}) {
    const [value, setValue] = useState<Application>(() => {
        const val = props.meta;
        if (val) {
            const app = val as Application;
            app?.pages?.forEach(p => {
                if (!p.name) {
                    p.name = 'anonymous'
                }
            })
            return app as Application;
        }
        return {} as Application;
    });
    const [designMode, setDesignMode] = useState(false);
    useEffect(() => {
        function onF10(event:KeyboardEvent) {
            if(event.code === 'F10'){
                event.preventDefault();
                event.stopPropagation();
                setDesignMode(!designMode);
            }
        }
        function onF5(event:KeyboardEvent) {
            if(event.code === 'F5'){
                event.preventDefault();
                event.stopPropagation();
                location.reload();
            }
        }

        async function onF12(event:KeyboardEvent) {
            if(event.code === 'F12'){
                event.preventDefault();
                event.stopPropagation();
                await openDevTools()
            }
        }
        window.addEventListener('keydown',onF10)
        window.addEventListener('keydown',onF12)
        window.addEventListener('keydown',onF5)
        return () => {
            window.removeEventListener('keydown',onF10)
            window.removeEventListener('keydown',onF12)
            window.removeEventListener('keydown',onF5)
        }
    }, [designMode]);
    return <div style={{display: 'flex', width: '100%', height: '100%', flexDirection: 'column'}}>
        {designMode && <AppDesigner value={value} onChange={async (val) => {
            setValue(val);
            saveAppMeta(val).then()
        }}/>}
        {!designMode && <AppViewer value={value} onChange={async (val) => {
            setValue(val);
            saveAppMeta(val).then()
        }} startingPage={'adm/home/landing-page'}/>}
    </div>
}

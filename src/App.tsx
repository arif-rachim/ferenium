import AppDesigner, {Application} from "./app/designer/AppDesigner.tsx";
import {useEffect, useState} from "react";
import AppViewer from "./app/viewer/AppViewer.tsx";

export function App() {
    const [value, setValue] = useState<Application>(() => {
        const val = localStorage.getItem('app-designer');
        if (val && val.length > 0) {
            const app = JSON.parse(val) as Application;
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
                if('electronAPI' in window && window.electronAPI && typeof window.electronAPI === 'object' && 'openDevTools' in window.electronAPI && window.electronAPI.openDevTools && typeof window.electronAPI.openDevTools === 'function') {
                    await window.electronAPI.openDevTools();
                }
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
        {designMode && <AppDesigner value={value} onChange={(val) => {
            localStorage.setItem('app-designer', JSON.stringify(val));
            setValue(val);
        }}/>}
        {!designMode && <AppViewer value={value} onChange={(val) => {
            localStorage.setItem('app-designer', JSON.stringify(val));
            setValue(val);
        }} startingPage={'adm/home/landing-page'}/>}
        {/*<Button style={{position: 'absolute', bottom: 2, right: 2}} onClick={() => setDesignMode(!designMode)} icon={'IoMdSettings'}></Button>*/}
    </div>
}

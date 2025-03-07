import {useUpdateDragContainer} from "../../core/hooks/useUpdateSelectedDragContainer.ts";
import {CSSProperties, useState} from "react";
import {PageInputSelector} from "./PageInputSelector.tsx";
import {Container} from "../designer/AppDesigner.tsx";
import {BORDER} from "../../core/style/Border.ts";
import {Icon} from "../../core/components/icon/Icon.ts";
import {useSignalEffect} from "react-hook-signal";
import {usePropertyEditorInitialHook} from "../../core/hooks/usePropertyEditorInitialHook.ts";

const green = 'green';
const red = 'red';

export function PageSelectionPropertyEditor(props: { propertyName: string }) {
    const {containerSignal, propertyName, hasError, isFormulaEmpty} = usePropertyEditorInitialHook(props);

    const update = useUpdateDragContainer();
    const [value, setValue] = useState<string>('');

    useSignalEffect(() => {
        const selectedDragContainer = containerSignal.get();
        if (selectedDragContainer && selectedDragContainer.properties && propertyName in selectedDragContainer.properties) {
            const formula = selectedDragContainer.properties[propertyName].formula;
            try {
                const fun = new Function('module', formula);
                const module = {exports: ''};
                fun.call(null, module)
                const pageId = module.exports
                setValue(pageId);
            } catch (err) {
                console.error(err);
            }
        }
    })
    const style: CSSProperties = {
        width: 38,
        flexShrink: 0,
        height: 21,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        background: isFormulaEmpty ? 'rgba(255,255,255,0.9)' : green,
        color: isFormulaEmpty ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
        padding: '0px 5px'
    };


    return <div style={{display: 'flex'}}>
        <PageInputSelector value={value} style={style} onChange={(value) => {
            const containerId = containerSignal.get()?.id;
            if (containerId) {
                update(containerId, (selectedContainer: Container) => {
                    if (value) {
                        selectedContainer.properties = {
                            ...selectedContainer.properties,
                            [propertyName]: {formula: `module.exports = "${value}"`,}
                        }
                        return selectedContainer;
                    } else {
                        selectedContainer.properties = {...selectedContainer.properties};
                        delete selectedContainer.properties[propertyName];
                        return selectedContainer;
                    }
                });
            }
        }} hidePageName={true} bindWithMapper={false}/>
        <div style={{
            width: 28,
            display: 'flex',
            padding: '0px 5px',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.05)',
            border: BORDER,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20
        }}>
            {hasError && <Icon.Error style={{fontSize: 16, color: red}}/>}
            {!hasError && <Icon.Checked style={{fontSize: 16, color: green}}/>}
        </div>
    </div>
}

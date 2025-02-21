import {useUpdateDragContainer} from "../../core/hooks/useUpdateSelectedDragContainer.ts";
import {CSSProperties, useState} from "react";
import {PageInputSelector} from "./PageInputSelector.tsx";
import {Container} from "../designer/AppDesigner.tsx";
import {BORDER} from "../../core/style/Border.ts";
import {Icon} from "../../core/components/icon/Icon.ts";
import {useSignalEffect} from "react-hook-signal";
import {usePropertyEditorInitialHook} from "../../core/hooks/usePropertyEditorInitialHook.ts";
import {queryGridColumnsTemporalColumnsSignal} from "../designer/editor/queryGridColumnsTemporalColumnsSignal.ts";

const green = 'green';
const red = 'red';

export function PageSelectionWithMapperPropertyEditor(props: { propertyName: string, mapperInputSchema?: string }) {
    const {containerSignal, propertyName, hasError, isFormulaEmpty} = usePropertyEditorInitialHook(props);

    const update = useUpdateDragContainer();
    const [value, setValue] = useState<{
        rendererPageId?: string,
        rendererPageDataMapperFormula?: string
    } | undefined>();

    const [mapperInputSchema, setMapperInputSchema] = useState<string>(props.mapperInputSchema ?? '');

    useSignalEffect(() => {
        const container = containerSignal.get();
        const queryGridColumnsTemporalColumns = queryGridColumnsTemporalColumnsSignal.get();
        if (container) {
            let columns: string[] | undefined = undefined;
            if (container.id in queryGridColumnsTemporalColumns && queryGridColumnsTemporalColumns[container.id].length > 0) {
                columns = queryGridColumnsTemporalColumns[container.id] as string[];
                setMapperInputSchema(`{${columns.map(c => `${c} ?: number | string | Uint8Array | null `).join(',')}}`);
            }
        }
    })

    useSignalEffect(() => {
        const container = containerSignal.get();
        if (container && container.properties && propertyName in container.properties) {
            const formula = container.properties[propertyName].formula;
            try {
                const fun = new Function('module', formula);
                const module = {exports: undefined};
                fun.call(null, module)
                const val = module.exports
                setValue(val);
            } catch (err) {
                console.error(err);
            }
        } else {
            setValue(undefined);
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
        <PageInputSelector
            style={style}
            hidePageName={true}
            chipColor={'rgba(0,0,0,0)'}
            onChange={(rendererPageId, rendererPageDataMapperFormula) => {
                const containerId = containerSignal.get()?.id;
                if (containerId) {
                    update(containerId, (selectedContainer: Container) => {
                        if (rendererPageId) {
                            selectedContainer.properties = {...selectedContainer.properties}
                            selectedContainer.properties[propertyName] = {
                                formula: `module.exports = ${JSON.stringify({
                                    rendererPageDataMapperFormula,
                                    rendererPageId
                                })}`
                            }
                            return selectedContainer;
                        } else {
                            selectedContainer.properties = {...selectedContainer.properties};
                            delete selectedContainer.properties[propertyName];
                            return selectedContainer;
                        }
                    });
                }
            }}
            value={value?.rendererPageId}
            bindWithMapper={true}
            mapperInputSchema={mapperInputSchema}
            mapperValue={value?.rendererPageDataMapperFormula}
        />
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

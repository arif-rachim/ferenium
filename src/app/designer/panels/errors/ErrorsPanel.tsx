import {notifiable, useComputed} from "react-hook-signal";
import {colors} from "../../../../core/style/colors.ts";
import {ComponentPropertyEditor} from "../properties/ComponentPropertyEditor.tsx";
import {VariableEditorPanel} from "../variables/VariableEditorPanel.tsx";
import {Icon} from "../../../../core/components/icon/Icon.ts";
import {CSSProperties} from "react";
import {useAddDashboardPanel} from "../../hooks/useAddDashboardPanel.tsx";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {AppDesignerContext} from "../../AppDesignerContext.ts";

export function ErrorsPanel() {
    const addPanel = useAddDashboardPanel();
    const {
        allErrorsSignal,
        allContainersSignal,
        allPageVariablesSignal,
        selectedDragContainerIdSignal
    } = useAppContext<AppDesignerContext>();
    const errorsComputed = useComputed(() => {
        let errors = allErrorsSignal.get();
        const containers = allContainersSignal.get();
        const variables = allPageVariablesSignal.get();
        errors = errors.filter(e => {
            if (e.type === 'property') {
                return containers.findIndex(c => e.containerId === c.id) >= 0
            }
            if (e.type === 'variable') {
                return variables.findIndex(c => e.variableId === c.id) >= 0
            }
            return false;
        })
        return errors;
    })
    return <notifiable.div
        style={() => {
            const hasErrors = errorsComputed.get().length > 0;
            return {
                display: hasErrors ? 'flex' : 'none',
                flexDirection: 'column',
                color: colors.red,
                overflow: 'auto',
                maxHeight: 100,
                flexShrink: 0,
                minHeight: 100,
                padding: '10px 0px'
            } as CSSProperties
        }}>
        {() => {
            const containers = allContainersSignal.get();
            const variables = allPageVariablesSignal.get();
            return <>
                {errorsComputed.get().map(e => {
                    let type: string | undefined = undefined;
                    let name: string | undefined = undefined;
                    let referenceId: string | undefined = undefined;
                    if (e.type === 'property') {
                        const container = containers.find(c => c.id === e.containerId);
                        type = container?.type;
                        name = e.propertyName;
                        referenceId = e.containerId;
                    }
                    if (e.type === 'variable') {
                        const v = variables.find(c => c.id === e.variableId)
                        type = v?.type;
                        name = v?.name;
                        referenceId = e.variableId
                    }

                    return <div key={`${e.message}-${referenceId}-${name}`}
                                style={{display: 'flex', flexDirection: 'row', padding: '0px 20px'}}>
                        <div style={{
                            width: 100,
                            flexShrink: 0,
                            padding: '2px 10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>{type}</div>
                        <div style={{
                            width: 100,
                            flexShrink: 0,
                            padding: '2px 10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>{name}</div>
                        <div style={{flexGrow: 1, padding: '2px 10px'}}>{e.message}</div>
                        <div style={{
                            width: 50,
                            flexShrink: 0,
                            padding: '2px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} onClick={async () => {

                            if (e.type === 'property') {
                                const panelId = `${e?.containerId}-${name}`;
                                selectedDragContainerIdSignal.set(e.containerId);
                                addPanel({
                                    position: 'mainCenter',
                                    component: () => {
                                        return <ComponentPropertyEditor name={e.propertyName}
                                                                        containerId={e?.containerId ?? ''}
                                                                        panelId={panelId}
                                        />
                                    },
                                    title: `${type} : ${name}`,
                                    Icon: Icon.Property,
                                    id: panelId,
                                    tag: {
                                        containerId: e.containerId,
                                        propertyName: e.propertyName,
                                        type: 'ComponentPropertyEditor'
                                    }
                                })
                            }

                            if (e.type === 'variable') {
                                addPanel({
                                    position: 'mainCenter',
                                    component: () => {
                                        return <VariableEditorPanel variableId={e.variableId} defaultType={'state'}
                                                                    panelId={e.variableId} scope={'page'}/>
                                    },
                                    title: `${type} : ${name}`,
                                    Icon: Icon.Component,
                                    id: e.variableId,
                                    tag: {
                                        variableId: e.variableId,
                                        type: 'VariableEditorPanel'
                                    }
                                })

                            }

                        }}><Icon.Detail style={{fontSize: 18}}/></div>
                    </div>
                })}
            </>
        }}
    </notifiable.div>
}
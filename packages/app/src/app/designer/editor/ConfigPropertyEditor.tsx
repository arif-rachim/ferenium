import {useSelectedDragContainer} from "../../../core/hooks/useSelectedDragContainer.ts";
import {useAppContext} from "../../../core/hooks/useAppContext.ts";
import {isEmpty} from "../../../core/utils/isEmpty.ts";
import {useUpdateDragContainer} from "../../../core/hooks/useUpdateSelectedDragContainer.ts";
import {CSSProperties, useEffect, useMemo, useRef, useState} from "react";
import {BORDER} from "../../../core/style/Border.ts";
import {Icon} from "../../../core/components/icon/Icon.ts";
import {useShowModal} from "../../../core/hooks/modal/useShowModal.ts";
import {Button} from "../../button/Button.tsx";
import {ColumnsConfig} from "../panels/database/TableEditor.tsx";
import {Container} from "../AppDesigner.tsx";
import {PageInputSelector} from "../../data/PageInputSelector.tsx";
import {AppDesignerContext} from "../AppDesignerContext.ts";
import {MdOutlineCheckBox, MdOutlineCheckBoxOutlineBlank} from "react-icons/md";
import {IoMdCheckbox} from "react-icons/io";
import {queryGridColumnsTemporalColumnsSignal} from "./queryGridColumnsTemporalColumnsSignal.ts";
import {ValueMapperSelector} from "../../data/ValueMapperSelector.tsx";

const green = 'green';
const red = 'red';

function getFormula(container: Container | undefined, propertyName: string) {
    if (container && container.properties[propertyName]) {
        return container.properties[propertyName].formula;
    }
    return '';
}

export function ConfigPropertyEditor(props: { propertyName: string }) {
    const containerSignal = useSelectedDragContainer();
    const context = useAppContext<AppDesignerContext>();

    const container = containerSignal.get();
    const {propertyName} = props;
    const hasError = context.allErrorsSignal.get().find(i => i.type === 'property' && i.propertyName === propertyName && i.containerId === container?.id) !== undefined;
    const formula = getFormula(container, propertyName);
    const isFormulaEmpty = isEmpty(formula);
    const update = useUpdateDragContainer();
    const showModal = useShowModal();

    async function updateTableConfig() {
        const updatedFormula = await showModal(closePanel => {
            return <AppDesignerContext.Provider value={context}>
                <EditColumnConfigFormula closePanel={closePanel} formula={formula}
                                         columns={queryGridColumnsTemporalColumnsSignal.get()[container?.id ?? '']}
                />
            </AppDesignerContext.Provider>
        });
        if (updatedFormula && typeof updatedFormula === 'string' && container?.id) {
            update(container.id, container => {
                container.properties = {...container.properties}
                container.properties[propertyName] = {...container.properties[propertyName]}
                container.properties[propertyName].formula = updatedFormula;
            })
        }
    }


    return <div style={{display: 'flex'}}>
        <Button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            background: isFormulaEmpty ? 'rgba(255,255,255,0.9)' : green,
            color: isFormulaEmpty ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
            padding: '0px 5px'
        }} onClick={updateTableConfig}><Icon.Formula style={{fontSize: 16}}/></Button>
        <div style={{
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


function EditColumnConfigFormula(props: {
    closePanel: (formula?: string) => void,
    formula?: string,
    columns?: string[],
}) {
    const {columns: columnsProps, formula, closePanel} = props;
    const [config, setConfig] = useState<ColumnsConfig>({});
    const [allHiddenStatus, setAllHiddenStatus] = useState<ThreeState>('no');
    const columns = useMemo(() => {
        return ((columnsProps ?? []).map((col, index) => {
            if (config && col in config && config[col]) {
                return {col, index: config[col].index}
            }
            return {col, index}
        }) as Array<{ col: string, index: number }>).sort((a, b) => (a.index - b.index)).map(i => i.col);
    }, [columnsProps, config])
    const propsRef = useRef({columns});
    propsRef.current.columns = columns;

    useEffect(() => {
        if (formula) {
            setTimeout(() => {
                try {
                    const module = {exports: {}};
                    const fun = new Function('module', formula);
                    fun.call(null, module);
                    setConfig(module.exports);
                } catch (err) {
                    console.error(err);
                }
            }, 100)
        }
    }, [formula]);

    useEffect(() => {
        const columns = propsRef.current.columns;
        if (allHiddenStatus === 'yes') {
            setConfig(oldConfig => {
                if (columns) {
                    const clone = {...oldConfig};
                    for (const col of columns) {
                        clone[col] = {...clone[col]};
                        clone[col].hidden = true;
                    }
                    return clone;
                }
                return oldConfig;
            })
        }
        if (allHiddenStatus === 'no') {
            setConfig(oldConfig => {
                if (columns) {
                    const clone = {...oldConfig};
                    for (const col of columns) {
                        clone[col] = {...clone[col]};
                        clone[col].hidden = false;
                    }
                    return clone;
                }
                return oldConfig;
            })
        }
    }, [allHiddenStatus]);
    return <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0px 10px',
            gap: 10,
            overflow: 'auto',
            maxHeight: '100%'
        }}>

        <div style={{display: 'table', overflowY: 'auto', height: '100%'}}>
            <div style={{display: 'table-row', position: 'sticky', top: 0, background: 'white'}}>
                <div style={{display: 'table-cell', padding: '0px 5px'}}>
                </div>
                <div style={{display: 'table-cell', padding: '10px 5px'}}>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingRight: 1}}>
                        <div style={{paddingBottom: 2}}>Is Hidden</div>
                        <InputThreeStateCheckbox value={allHiddenStatus} onChange={setAllHiddenStatus}
                                                 style={{fontSize: 17, color: 'rgba(0,0,0,0.6)'}}/>
                    </div>
                </div>
                <div style={{display: 'table-cell', padding: '0px 5px'}}>
                    Min Width
                </div>
                <div style={{display: 'table-cell', padding: '0px 5px'}}>
                    Max Width
                </div>
                <div style={{display: 'table-cell', padding: '0px 5px', width: 120}}>
                    Cell Mapper
                </div>
                <div style={{display: 'table-cell', padding: '0px 5px', width: 200,maxWidth:200}}>
                    Renderer
                </div>
                <div style={{display: 'table-cell', padding: '0px 5px'}}>
                    Title
                </div>
            </div>
            {(columns ?? []).map((col, index, source) => {
                const isLastIndex = source.length - 1 === index;
                const conf = config[col] ?? {
                    hidden: false,
                    width: undefined,
                    title: undefined,
                    rendererPageId: undefined
                };
                return <div key={col} style={{display: 'table-row'}} draggable={true} onDragStart={(e) => {
                    e.dataTransfer.setData('text', JSON.stringify({col}));
                }} onDragOver={e => {
                    e.preventDefault();
                }} onDrop={e => {
                    const {col: sourceCol} = JSON.parse(e.dataTransfer.getData('text'));
                    const columnsNew = columns.filter(i => i !== sourceCol);
                    //columnsNew.splice(columnsNew.indexOf(col) + 1, 0, sourceCol);
                    columnsNew.splice(columnsNew.indexOf(col), 0, sourceCol);
                    setConfig(oldConfig => {
                        if (columns) {
                            const clone = {...oldConfig};
                            for (const col of columns) {
                                clone[col] = {...clone[col]};
                                clone[col].index = columnsNew.indexOf(col);
                            }
                            return clone;
                        }
                        return oldConfig;
                    })
                }}>

                    <div style={{display: 'table-cell', padding: '0px 5px'}}>
                        {col}
                    </div>
                    <div style={{
                        display: 'table-cell',
                        padding: '0px 5px',
                        textAlign: 'right',
                        verticalAlign: 'center'
                    }}>
                        <input type={"checkbox"} checked={conf.hidden}
                               onChange={(e) => {
                                   const value = e.target.checked;
                                   setConfig(old => {
                                       const clone = {...old};
                                       clone[col] = {...clone[col]}
                                       clone[col].hidden = value
                                       return clone;
                                   })
                               }}/>
                    </div>
                    <div style={{display: 'table-cell'}}>
                        <input style={{
                            border: BORDER,
                            borderRight: 'unset',
                            borderBottom: isLastIndex ? BORDER : 'unset',
                            borderRadius: 0,
                            padding: '0px 5px',
                            width: 70
                        }}
                               value={(conf.minWidth ?? '').toString()}
                               onChange={(e) => {
                                   const value = e.target.value;
                                   const isPercentageOrPixel = value.endsWith('%') || value.endsWith('px') || value.endsWith('p');
                                   const intValue = parseInt(value);
                                   setConfig(old => {
                                       const clone = {...old};
                                       clone[col] = {...clone[col]}
                                       if (isPercentageOrPixel || isNaN(intValue)) {
                                           clone[col].minWidth = value
                                       } else {
                                           clone[col].minWidth = intValue
                                       }

                                       return clone;
                                   })
                               }}
                        />
                    </div>
                    <div style={{display: 'table-cell'}}>
                        <input style={{
                            border: BORDER,
                            borderRight: 'unset',
                            borderBottom: isLastIndex ? BORDER : 'unset',
                            borderRadius: 0,
                            padding: '0px 5px',
                            width: 70
                        }}
                               value={(conf.maxWidth ?? '').toString()}
                               onChange={(e) => {
                                   const value = e.target.value;
                                   const isPercentageOrPixel = value.endsWith('%') || value.endsWith('px') || value.endsWith('p');
                                   const intValue = parseInt(value);
                                   setConfig(old => {
                                       const clone = {...old};
                                       clone[col] = {...clone[col]}
                                       if (isPercentageOrPixel || isNaN(intValue)) {
                                           clone[col].maxWidth = value
                                       } else {
                                           clone[col].maxWidth = intValue
                                       }

                                       return clone;
                                   })
                               }}
                        />
                    </div>
                    <div style={{display: 'table-cell', verticalAlign: 'middle'}}>
                        <ValueMapperSelector style={{
                            padding: '0px 5px',
                            borderRadius: 0,
                            height: 23,
                            borderBottom: isLastIndex ? '1px solid rgba(0,0,0,0.1)' : 'unset',
                            borderRight: 'unset',
                            width: '100%',
                        }}
                                             value={conf.cellValueMapper}
                                             mapperInputSchema={composeMapperInputSchema(columns)}
                                             onChange={(value) => {
                                                 setConfig(old => {
                                                     const clone = {...old};
                                                     clone[col] = {...clone[col]}
                                                     if (value === undefined) {
                                                         delete clone[col].cellValueMapper;
                                                     } else {
                                                         clone[col].cellValueMapper = value;
                                                     }
                                                     return clone;
                                                 })
                                             }}/>

                    </div>
                    <div style={{display: 'table-cell', verticalAlign: 'middle', width: 200,maxWidth:200}}>
                        <PageInputSelector style={{
                            borderRadius: 0,
                            height: 23,
                            padding: '0px 5px',
                            borderRight: 'unset',
                            borderBottom: isLastIndex ? BORDER : 'unset',
                        }}
                                           chipColor={'rgba(0,0,0,0)'}
                                           onChange={(pageId, mapperFormula) => {
                                               setConfig(old => {
                                                   const clone = {...old};
                                                   clone[col] = {...clone[col]}
                                                   clone[col].rendererPageId = pageId;
                                                   clone[col].rendererPageDataMapperFormula = mapperFormula;
                                                   return clone;
                                               })
                                           }}
                                           value={conf.rendererPageId}
                                           bindWithMapper={true}
                                           mapperInputSchema={composeMapperInputSchema(columns)}
                                           mapperValue={conf.rendererPageDataMapperFormula}

                        />
                    </div>

                    <div style={{display: 'table-cell'}}>
                        <input style={{
                            border: BORDER,
                            borderRadius: 0,
                            padding: '0px 5px',
                            borderBottom: isLastIndex ? BORDER : 'unset'
                        }}
                               value={conf?.title}
                               onChange={(e) => {
                                   const value = e.target.value;
                                   setConfig(old => {
                                       const clone = {...old};
                                       clone[col] = {...clone[col]}
                                       clone[col].title = value;
                                       return clone;
                                   })
                               }}
                        />
                    </div>
                </div>
            })}

        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 5,
            position: 'sticky',
            bottom: 0,
            background: 'white',
            padding: 10
        }}>
            <Button onClick={() => {
                // here we need to save this convert to formula
                const formula = `module.exports = ${JSON.stringify(config, null, 2)};`;
                closePanel(formula);
            }}>Save</Button>
            <Button onClick={() => props.closePanel()}>Cancel</Button>
        </div>
    </div>
}

type ThreeState = 'yes' | 'no' | 'partial';

function InputThreeStateCheckbox(props: {
    value: ThreeState,
    onChange: (param: ThreeState) => void,
    style: CSSProperties
}) {
    const {value, onChange, style} = props;
    const [val, setVal] = useState<ThreeState>(value);

    function onClick() {
        if (val === 'yes') {
            setVal('no');
            onChange('no');
        }
        if (val === 'no') {
            setVal('yes');
            onChange('yes');
        }
        if (val === 'partial') {
            setVal('no');
            onChange('no');
        }
    }

    useEffect(() => {
        setVal(value);
    }, [value]);
    let Component = IoMdCheckbox;
    if (val === 'yes') {
        Component = IoMdCheckbox
    }
    if (val === 'no') {
        Component = MdOutlineCheckBoxOutlineBlank
    }
    if (val === 'partial') {
        Component = MdOutlineCheckBox;
    }
    return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}} onClick={onClick}>
        <Component/>
    </div>
}

function composeMapperInputSchema(columns?: string[]) {
    columns = columns ?? [];
    const inputSchema = `{${columns.map(c => `${c} ?: number | string | Uint8Array | null `).join(',')}}`
    return `{cellValue?:string|number|null,rowIndex:number,rowData:${inputSchema},columnName:string,gridData:Array<${inputSchema}>}`

}
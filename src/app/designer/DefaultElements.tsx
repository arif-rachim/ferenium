import {element, Element} from "./LayoutBuilderProps.ts";
import {z, ZodFunction, ZodObject, ZodOptional, ZodRawShape, ZodTuple, ZodType, ZodTypeAny} from "zod";
import {CSSProperties, ForwardedRef, forwardRef, LegacyRef, MutableRefObject} from "react";
import {Icon} from "../../core/components/icon/Icon.ts";
import {Button} from "../button/Button.tsx";
import {PageSelectionPropertyEditor} from "../data/PageSelectionPropertyEditor.tsx";
import {Container} from "./AppDesigner.tsx";
import {ContainerRendererIdContext} from "./panels/design/ContainerRenderer.tsx";
import {QueryGrid} from "../data/QueryGrid.tsx";
import {ConfigPropertyEditor} from "./editor/ConfigPropertyEditor.tsx";
import {IconType} from "react-icons";
import {cssLength, cssPropertiesSchema, iconSchema} from "./cssPropertiesSchema.ts";
import {ComponentRenderer} from "../data/ComponentRenderer.tsx";
import {faultToIconByStatusId} from "../../core/components/fault-status-icon/faultToIconByStatusId.tsx";
import {TextInput} from "../form/input/text/TextInput.tsx";
import {DateInput} from "../form/input/date/DateInput.tsx";
import {DateRangeInput} from "../form/input/date/DateRangeInput.tsx";
import {SelectInput} from "../form/input/select/SelectInput.tsx";
import {zodSchemaToZodType} from "../../core/utils/zodSchemaToJson.ts";
import {createCustomPropertyEditor} from "../data/CustomPropertyEditor.tsx";
import {DateTimeInput} from "../form/input/date/DateTimeInput.tsx";
import {useContainerLayoutHook} from "../form/container/useContainerLayoutHook.tsx";
import {useContainerStyleHook} from "../form/container/useContainerStyleHook.ts";
import {Form} from "../form/Form.tsx";
import {CheckboxInput} from "../form/input/checkbox/CheckboxInput.tsx";
import {RadioInput} from "../form/input/radio/RadioInput.tsx";
import {IconElement} from "../../core/components/icon/IconElement.tsx";
import {
    MdInsertEmoticon,
    MdOutlineCalendarMonth,
    MdOutlineSubtitles,
    MdPunchClock,
    MdRadioButtonChecked
} from "react-icons/md";
import {FaWpforms} from "react-icons/fa";
import {IoCheckboxOutline} from "react-icons/io5";
import {IoMdTime} from "react-icons/io";
import {LuCalendarRange, LuTextCursorInput} from "react-icons/lu";
import {RxButton} from "react-icons/rx";
import {BsMenuButtonWide} from "react-icons/bs";
import {PageSelectionWithMapperPropertyEditor} from "../data/PageSelectionWithMapperPropertyEditor.tsx";
import {TimeInput} from "../form/input/date/TimeInput.tsx";

const ZodSqlValue = z.union([z.number(), z.string(), z.instanceof(Uint8Array), z.null()]);
export const DefaultElements: Record<string, Element> = {
    container: element({
        shortName: 'Container',
        icon: Icon.Container,
        property: {
            style: cssPropertiesSchema,
            onClick: z.function().returns(z.void()),
            onMouseDown: z.function().returns(z.void()),
            onMouseUp: z.function().returns(z.void()),
            hidden: z.boolean().optional(),
            dataElementId:z.string()
        },
        component: (props, ref) => {
            const {container, onClick, style, onMouseDown, onMouseUp, hidden} = props;
            return <LayoutContainer ref={ref}
                                    dataElementId={props.dataElementId}
                                    container={container}
                                    onClick={onClick}
                                    style={style}
                                    onMouseDown={onMouseDown}
                                    onMouseUp={onMouseUp}
                                    hidden={hidden}
            />
        }
    }),
    titleBox: element({
        shortName: 'Title Box',
        icon: MdOutlineSubtitles,
        property: {
            style: cssPropertiesSchema,
            dimension: z.object({
                width: cssLength,
                height: cssLength,
                flexGrow: z.number().optional(),
                flexShrink: z.number().optional(),
                minWidth: cssLength,
                maxWidth: cssLength,
                minHeight: cssLength,
                maxHeight: cssLength,
                overflow: z.enum(['auto', 'hidden']).optional()
            }),
            onClick: z.function().returns(z.void()),
            title: z.string()
        },
        component: (props, ref) => {
            const {style, onClick, title, container, dimension} = props;
            return <TitleBox ref={ref}
                             style={style}
                             onClick={onClick}
                             title={title}
                             container={container}
                             dimension={dimension}
                             dataElementId={props.dataElementId}
            />
        }
    }),
    form: element({
        shortName: 'Form',
        icon: FaWpforms,
        property: {
            style: cssPropertiesSchema,
            value: z.record(z.unknown()).optional(),
            disabled: z.boolean().optional(),
            decorator: z.function().args(z.record(z.unknown()).optional(), z.record(z.unknown()).optional()).returns(z.promise(z.record(z.unknown()))),
            onChange: z.function().args(
                z.record(z.unknown()),
                z.object({
                    errors: z.object({
                        get: z.function().args().returns(z.record(z.string())),
                        set: z.function().args(z.record(z.string())).returns(z.void()),
                    }),
                    value: z.object({
                        get: z.function().args().returns(z.record(z.unknown())),
                        set: z.function().args(z.record(z.unknown())).returns(z.void()),
                    }),
                    initialValue: z.record(z.unknown()).optional(),
                    reset: z.function().returns(z.void())
                })
            ).returns(z.union([z.promise(z.void()), z.void()])).optional(),
            schema: z.any()
        },
        component: (props, ref) => {
            const {container, onChange, disabled, value, decorator} = props;
            return <Form ref={ref as MutableRefObject<HTMLFormElement>} {...props}
                         disabled={disabled}
                         style={props.style as CSSProperties}
                         container={container}
                         dataElementId={props.dataElementId}
                         onChange={onChange}
                         decorator={decorator}
                         value={value}

            />
        },
        propertyEditor: {
            value: {
                label: 'value',
                component: createCustomPropertyEditor((props) => {
                    const {element, propertyName, container} = props;
                    let returnTypeZod: ZodType = z.any();
                    if (element) {
                        returnTypeZod = element.property[propertyName]
                    }
                    if ('schema' in container.properties && container.properties.schema && container.properties.schema.formula) {
                        try {
                            const fun = new Function('module', 'z', container.properties.schema.formula);
                            const module: { exports: ZodType | undefined } = {exports: undefined};
                            fun.apply(null, [module, z]);
                            if (module.exports) {
                                returnTypeZod = module.exports
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    return returnTypeZod;
                })
            },
            decorator: {
                label: 'decorator',
                component: createCustomPropertyEditor((props) => {
                    const {element, propertyName, container} = props;
                    let returnTypeZod: ZodType = z.any();
                    if (element) {
                        returnTypeZod = element.property[propertyName]
                    }
                    if ('schema' in container.properties && container.properties.schema && container.properties.schema.formula) {
                        try {
                            const fun = new Function('module', 'z', container.properties.schema.formula);
                            const module: { exports: ZodType | undefined } = {exports: undefined};
                            fun.apply(null, [module, z]);
                            if (module.exports) {
                                const type = module.exports as ZodType
                                returnTypeZod = z.function().args(type, type).returns(z.promise(type))
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    return returnTypeZod;
                })
            },
            onChange: {
                label: 'onChange',
                component: createCustomPropertyEditor((props) => {
                    const {element, propertyName, container} = props;
                    let returnTypeZod: ZodType = z.any();
                    if (element) {
                        returnTypeZod = element.property[propertyName]
                    }

                    if ('schema' in container.properties && container.properties.schema && container.properties.schema.formula) {
                        try {
                            const fun = new Function('module', 'z', container.properties.schema.formula);
                            const module: { exports: ZodType | undefined } = {exports: undefined};
                            fun.apply(null, [module, z]);
                            if (module.exports) {
                                let voSchema = module.exports as ZodObject<ZodRawShape>;
                                if (voSchema instanceof ZodOptional) {
                                    const def = voSchema._def as { innerType: ZodObject<ZodRawShape> };
                                    voSchema = def.innerType as ZodObject<ZodRawShape>
                                }
                                const shapes = Object.keys(voSchema._def.shape() as object) as Array<string>;
                                const errorsSchema = z.object(shapes.reduce((result, key) => {
                                    result[key] = z.string().optional();
                                    return result;
                                }, {} as Record<string, ZodType>));
                                const configSchema = z.object({
                                    errors: z.object({
                                        set: z.function().args(errorsSchema).returns(z.void()),
                                        get: z.function().args().returns(errorsSchema)
                                    }),
                                    value: z.object({
                                        set: z.function().args(voSchema).returns(z.void()),
                                        get: z.function().args().returns(voSchema)
                                    }),
                                    initialValue: voSchema,
                                    reset: z.function().returns(z.void())
                                })
                                returnTypeZod = z.function().args(module.exports, configSchema).returns(z.void())
                            }

                        } catch (err) {
                            console.error(err);
                        }
                    }
                    return returnTypeZod;
                })
            },
        }
    }),
    input: element({
        shortName: 'Input',
        icon: LuTextCursorInput,
        property: {
            value: z.string().optional(),
            name: z.string().optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            onChange: z.function().args(z.string().optional()).returns(z.union([z.promise(z.void()), z.void()])),
            onBlur: z.function().args(z.string()).returns(z.union([z.promise(z.void()), z.void()])),
            valueMapper: z.function().args(z.string().optional()).returns(z.promise(z.string().optional())),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema,
            type: z.enum(['text', 'number', 'password', 'textarea']).optional(),
            disabled: z.boolean().optional(),
            required: z.boolean().optional(),
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional()))
        },
        component: (props, ref) => {
            const {
                name,
                onChange,
                onBlur,
                value,
                label,
                error,
                type,
                disabled,
                inputStyle,
                valueMapper,
                validator,
                required
            } = props;
            return <TextInput ref={ref as MutableRefObject<HTMLLabelElement>}
                              style={props.style}
                              name={name}
                              onChange={onChange}
                              value={value}
                              label={label}
                              onBlur={onBlur}
                              disabled={disabled}
                              inputStyle={inputStyle as CSSProperties}
                              error={error}
                              type={type}
                              valueToLocalValue={valueMapper}
                              validator={validator}
                              required={required}
            />
        }
    }),
    checkbox: element({
        shortName: 'Checkbox',
        icon: IoCheckboxOutline,
        property: {
            name: z.string().optional(),
            label: z.string().optional(),
            value: z.boolean().optional(),
            onChange: z.function().args(z.boolean().optional()).returns(z.union([z.promise(z.void()), z.void()])).optional(),
            error: z.string().optional(),
            style: cssPropertiesSchema,
            disabled: z.boolean().optional(),
            required: z.boolean().optional(),
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional())),
        },
        component: (props, ref) => {
            const {style, name, onChange, value, label, error, disabled, required, validator} = props;
            return <CheckboxInput ref={ref as MutableRefObject<HTMLLabelElement>}
                                  style={style}
                                  name={name}
                                  onChange={onChange}
                                  value={value}
                                  label={label}
                                  error={error}
                                  disabled={disabled}
                                  required={required}
                                  validator={validator}
            />
        }
    }),
    radio: element({
        shortName: 'Radio',
        icon: MdRadioButtonChecked,
        property: {
            name: z.string().optional(),
            label: z.string().optional(),
            value: z.string().optional(),
            valueMatcher: z.string().optional(),
            onChange: z.function().args(z.string().optional()).returns(z.union([z.promise(z.void()), z.void()])).optional(),
            error: z.string().optional(),
            style: cssPropertiesSchema
        },
        component: (props, ref) => {
            const {style, name, onChange, value, valueMatcher, label, error} = props;
            return <RadioInput ref={ref as MutableRefObject<HTMLLabelElement>}
                               style={style}
                               name={name}
                               onChange={onChange}
                               value={value}
                               valueMatcher={valueMatcher}
                               label={label}
                               error={error}
            />
        }
    }),
    icon: element({
        shortName: 'Icon',
        icon: MdInsertEmoticon,
        property: {
            value: iconSchema,
            style: cssPropertiesSchema
        },
        component: (props, ref) => {
            const {style, value} = props;
            return <IconElement ref={ref as MutableRefObject<HTMLDivElement>}
                                style={style}
                                value={value}
            />
        }
    }),
    date: element({
        shortName: 'Date',
        icon: MdOutlineCalendarMonth,
        property: {
            name: z.string().optional(),
            value: z.union([z.date(), z.string()]).optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            disabled: z.boolean().optional(),
            onChange: z.function().args(z.union([z.date(), z.string()]).optional()).returns(z.union([z.promise(z.void()), z.void()])),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema,
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional())),
            required: z.boolean().optional(),
        },
        component: (props, ref) => {
            const {inputStyle, style, label, error, name, value, disabled, onChange, validator, required} = props;
            return <DateInput ref={ref as MutableRefObject<HTMLLabelElement>}
                              style={style as CSSProperties}
                              inputStyle={inputStyle as CSSProperties}
                              label={label}
                              error={error}
                              name={name}
                              value={value}
                              onChange={onChange}
                              disabled={disabled}
                              validator={validator}
                              required={required}
            />
        }
    }),
    dateTime: element({
        shortName: 'DateTime',
        icon: IoMdTime,
        property: {
            name: z.string().optional(),
            value: z.union([z.date(), z.string()]).optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            disabled: z.boolean().optional(),
            required: z.boolean().optional(),
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional())),
            onChange: z.function().args(z.union([z.date(), z.string()]).optional()).returns(z.union([z.promise(z.void()), z.void()])),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema
        },
        component: (props, ref) => {
            const {inputStyle, value, name, onChange, label, error, disabled, required, validator} = props;
            return <DateTimeInput ref={ref as MutableRefObject<HTMLLabelElement>}
                                  disabled={disabled}
                                  style={props.style as CSSProperties}
                                  inputStyle={inputStyle as CSSProperties}
                                  value={value}
                                  name={name}
                                  onChange={onChange}
                                  label={label}
                                  error={error}
                                  required={required}
                                  validator={validator}
            />
        }
    }),
    timeMinute: element({
        shortName: 'TimeMinute',
        icon: MdPunchClock,
        property: {
            name: z.string().optional(),
            value: z.union([z.number(), z.string()]).optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            disabled: z.boolean().optional(),
            required: z.boolean().optional(),
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional())),
            onChange: z.function().args(z.union([z.number(), z.string()]).optional()).returns(z.union([z.promise(z.void()), z.void()])),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema
        },
        component: (props, ref) => {
            const {inputStyle, value, name, onChange, label, error, disabled, required, validator} = props;
            return <TimeInput ref={ref as MutableRefObject<HTMLLabelElement>}
                              disabled={disabled}
                              style={props.style as CSSProperties}
                              inputStyle={inputStyle as CSSProperties}
                              value={value}
                              name={name}
                              onChange={(...args) => {
                                  if(onChange && typeof onChange === 'function'){
                                      onChange(...args)
                                  }
                              }}
                              label={label}
                              error={error}
                              required={required}
                              validator={validator}
            />
        }
    }),
    range: element({
        shortName: 'Range',
        icon: LuCalendarRange,
        property: {
            name: z.string().optional(),
            value: z.object({from: z.union([z.date(), z.string()]), to: z.union([z.date(), z.string()])}).optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            disabled: z.boolean().optional(),
            onChange: z.function().args(z.object({
                from: z.union([z.date(), z.string()]),
                to: z.union([z.date(), z.string()])
            }).optional()).returns(z.union([z.promise(z.void()), z.void()])),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema,
            required: z.boolean().optional(),
            validator: z.function().args(z.unknown().optional()).returns(z.promise(z.string().optional())).optional()
        },
        component: (props, ref) => {
            const {inputStyle, style, error, label, name, value, onChange, disabled, required, validator} = props;
            return <DateRangeInput ref={ref as MutableRefObject<HTMLLabelElement>}
                                   disabled={disabled}
                                   style={style as CSSProperties}
                                   inputStyle={inputStyle as CSSProperties}
                                   error={error}
                                   label={label}
                                   name={name}
                                   value={value}
                                   onChange={onChange}
                                   required={required}
                                   validator={validator}
            />
        }
    }),
    select: element({
        shortName: 'Select',
        icon: BsMenuButtonWide,
        property: {
            name: z.string().optional(),
            value: z.union([z.string(), z.number()]).optional(),
            label: z.string().optional(),
            error: z.string().optional(),
            onChange: z.function().args(z.union([z.string(), z.number(),z.null()]).optional()).returns(z.union([z.promise(z.void()), z.void()])),
            style: cssPropertiesSchema,
            inputStyle: cssPropertiesSchema,
            popupStyle: cssPropertiesSchema,
            query: z.function().args(z.object({
                params: z.record(ZodSqlValue).optional(),
                page: z.number().optional(),
                filter: z.record(z.unknown()).optional(),
                rowPerPage: z.number().optional(),
                sort: z.array(z.object({column: z.string(), direction: z.enum(['asc', 'desc'])}).optional()).optional(),
            })).returns(z.promise(z.object({
                error: z.string().optional(),
                data: z.array(z.record(z.union([z.number(), z.string()]))).optional(),
                totalPage: z.number().optional(),
                currentPage: z.number().optional(),
                columns: z.array(z.string()).optional()
            }))),
            config: z.record(z.object({
                hidden: z.boolean().optional(),
                width: z.union([z.string(), z.number()]).optional(),
                rendererPageId: z.string().optional(),
                title: z.string().optional()
            })),
            valueToRowData: z.function().args(ZodSqlValue.optional()).returns(z.promise(z.record(ZodSqlValue))).optional(),
            rowDataToText: z.function().args(z.record(ZodSqlValue).optional()).returns(z.string()),
            rowDataToRenderer: z.object({
                rendererPageId: z.string().optional(),
                rendererPageDataMapperFormula: z.string().optional()
            }),
            rowDataToValue: z.function().args(z.record(ZodSqlValue).optional()).returns(z.union([z.string(), z.number()])),
            filterable: z.boolean().optional(),
            sortable: z.boolean().optional(),
            pageable: z.boolean().optional(),
            disabled: z.boolean().optional(),
            itemToKey: z.function().args(z.record(ZodSqlValue).optional()).returns(z.union([z.string(), z.number()])),
            preventChange: z.function().args(ZodSqlValue.optional()).returns(z.promise(z.boolean())).optional(),
            validator: z.function().args(ZodSqlValue.optional()).returns(z.promise(z.string().optional())).optional(),
            required: z.boolean().optional()
        },

        component: (props, ref) => {
            const {
                style,
                inputStyle,
                popupStyle,
                container,
                config,
                query,
                itemToKey,
                rowDataToText,
                rowDataToRenderer,
                onChange,
                value,
                label,
                error,
                valueToRowData,
                rowDataToValue,
                name,
                filterable,
                pageable,
                sortable,
                disabled,
                preventChange,
                validator,
                required
            } = props;
            return <SelectInput ref={ref as MutableRefObject<HTMLLabelElement>}
                                style={style as CSSProperties}
                                inputStyle={inputStyle as CSSProperties}
                                popupStyle={popupStyle as CSSProperties}
                                container={container}
                                config={config}
                                query={query}
                                itemToKey={itemToKey}
                                rowDataToText={rowDataToText}
                                rowDataToRenderer={rowDataToRenderer}
                                onChange={onChange}
                                value={value}
                                label={label}
                                error={error}
                                valueToRowData={valueToRowData}
                                rowDataToValue={rowDataToValue}
                                name={name}
                                filterable={filterable !== false}
                                sortable={sortable !== false}
                                pageable={pageable !== false}
                                disabled={disabled}
                                preventChange={preventChange}
                                validator={validator}
                                required={required}
            />
        },
        propertyEditor: {
            config: {
                label: 'config',
                component: ConfigPropertyEditor
            },
            itemToKey: {
                label: 'itemToKey',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.function().args(z.object(param)).returns(z.union([z.string(), z.number()])) as unknown as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            rowDataToText: {
                label: 'rowDataToText',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>;
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = z.union([z.number(), z.string()]);
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.function().args(z.object(param).optional()).returns(z.string()) as unknown as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            rowDataToValue: {
                label: 'rowDataToValue',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = z.union([z.number(), z.string()]);
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.function().args(z.object(param).optional()).returns(z.union([z.string(), z.number()]).optional()) as unknown as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            rowDataToRenderer: {
                label: 'rowDataToRenderer',
                component: PageSelectionWithMapperPropertyEditor
            }
        }
    }),
    element: element({
        shortName: 'Component',
        icon: Icon.Component,
        property: {
            properties: z.record(z.unknown()).optional(),
            component: z.string(),
            style: cssPropertiesSchema,
        },
        component: (props, ref) => {
            const {properties, component, style} = props;
            return <ComponentRenderer style={style} component={component} ref={ref} {...properties}/>
        },
        propertyEditor: {
            component: {
                label: 'component',
                component: PageSelectionPropertyEditor
            },
            properties: {
                label: 'properties',
                component: createCustomPropertyEditor((props) => {
                    const {container, allPagesSignal} = props;
                    const fun = new Function('module', container.properties['component'].formula)
                    const module = {exports: ''};
                    fun.apply(null, [module])
                    const pageId = module.exports;
                    const page = allPagesSignal.get().find(p => p.id === pageId);
                    const returnType = (page?.variables ?? []).filter(v => v.type === 'state').reduce((result, s) => {
                        result[s.name] = zodSchemaToZodType(s.schemaCode).optional()
                        return result;
                    }, {} as ZodRawShape);
                    return z.object(returnType);
                })
            }
        }
    }),
    button: element({
        shortName: 'Button',
        icon: RxButton,
        property: {
            onClick: z.function().returns(z.void()),
            label: z.string(),
            style: cssPropertiesSchema,
            icon: iconSchema,
            type: z.enum(['button', 'submit', 'reset']).optional(),
            hidden: z.boolean().optional(),
            allowOnFormBusy: z.boolean().optional(),
            allowOnFormDisabled: z.boolean().optional(),
        },
        component: (props, ref) => {
            const {onClick, style, type, hidden, icon, allowOnFormBusy, allowOnFormDisabled} = props;
            let {label} = props;
            label = label ?? 'Add label here';
            delete style.background;

            return <Button style={style} ref={ref as LegacyRef<HTMLButtonElement>}
                           onClick={onClick} type={type} icon={icon} hidden={hidden} allowOnFormBusy={allowOnFormBusy}
                           allowOnFormDisabled={allowOnFormDisabled}>
                {label}
            </Button>
        }
    }),
    title: element({
        shortName: 'Text',
        icon: Icon.Title,
        property: {
            title: z.string(),
            style: cssPropertiesSchema
        },
        component: (props, ref) => {
            const {style} = props;
            let {title} = props;
            if (title && typeof title !== 'string') {
                title = JSON.stringify(title);
            }
            title = title ?? 'Add text here'
            return <div ref={ref as LegacyRef<HTMLDivElement>}
                        style={{flexShrink: 0, lineHeight: 1.1, ...style, minHeight: 12}}>{title}</div>
        }
    }),
    queryGrid: element({
        shortName: 'Table',
        icon: Icon.Grid,
        property: {
            query: z.function().args(z.object({
                params: z.record(ZodSqlValue).optional(),
                page: z.number().optional(),
                filter: z.record(z.unknown()).optional(),
                rowPerPage: z.number().optional(),
                sort: z.array(z.object({column: z.string(), direction: z.enum(['asc', 'desc'])}).optional()).optional(),
            })).returns(z.promise(z.object({
                error: z.string().optional(),
                data: z.array(z.record(z.union([z.number(), z.string()]))).optional(),
                totalPage: z.number().optional(),
                currentPage: z.number().optional(),
                columns: z.array(z.string()).optional()
            }))),
            config: z.record(z.object({
                hidden: z.boolean().optional(),
                width: z.union([z.string(), z.number()]).optional(),
                rendererPageId: z.string().optional(),
                title: z.string().optional()
            })),
            focusedRow: z.record(z.union([z.number(), z.string()])),
            onFocusedRowChange: z.function().args(z.object({
                value: z.record(ZodSqlValue),
                data: z.array(z.record(ZodSqlValue)),
                totalPage: z.number(),
                currentPage: z.number(),
                index: z.number()
            })).returns(z.promise(z.void())).optional(),
            refreshQueryKey: z.string().optional(),
            onRowDoubleClick: z.function().args(z.object({
                value: z.record(ZodSqlValue),
                data: z.array(z.record(ZodSqlValue)),
                totalPage: z.number(),
                currentPage: z.number(),
                index: z.number(),
                refresh: z.function().returns(z.void())
            })).returns(z.union([z.promise(z.void()), z.void()])).optional(),
            filterable: z.boolean().optional(),
            sortable: z.boolean().optional(),
            pageable: z.boolean().optional(),
            style: cssPropertiesSchema,
            itemToKey: z.function().args(z.record(ZodSqlValue)).returns(z.union([z.string(), z.number()])),
            selectedRows: z.array(z.union([z.number(), z.string()])),
            onMultipleSelectionChange: z.function().args(z.object({
                type: z.enum(['add', 'remove', 'addAll', 'removeAll']),
                value: z.union([z.string(), z.number()]).optional(),
                selectedRows: z.array(z.union([z.string(), z.number()]))
            })).returns(z.void()),
            enableMultipleSelection: z.union([z.boolean(),z.function().args(z.record(ZodSqlValue).optional()).returns(z.boolean())]).optional(),
        },
        component: (props, ref) => {
            const {
                query,
                style,
                config,
                focusedRow,
                onFocusedRowChange,
                container,
                refreshQueryKey,
                onRowDoubleClick,
                filterable,
                sortable,
                pageable,
                itemToKey,
                enableMultipleSelection,
                selectedRows,
                onMultipleSelectionChange
            } = props;
            return <QueryGrid ref={ref as ForwardedRef<HTMLDivElement>} query={query} style={style}
                              columnsConfig={config}
                              onFocusedRowChange={onFocusedRowChange}
                              focusedRow={focusedRow} container={container}
                              refreshQueryKey={refreshQueryKey} onRowDoubleClick={onRowDoubleClick}
                              filterable={filterable} sortable={sortable} pageable={pageable}
                              itemToKey={itemToKey} enableMultipleSelection={enableMultipleSelection}
                              selectedRows={selectedRows}
                              onMultipleSelectionChange={onMultipleSelectionChange}
            />
        },
        propertyEditor: {
            config: {
                label: 'config',
                component: ConfigPropertyEditor
            },
            itemToKey: {
                label: 'itemToKey',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.function().args(z.object(param)).returns(z.union([z.string(), z.number()])) as unknown as ZodFunction<ZodTuple, ZodTypeAny>;
                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            enableMultipleSelection:{
                label: 'enableSelection',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.union([z.boolean(),z.function().args(z.object(param)).returns(z.boolean())]) as unknown as ZodFunction<ZodTuple, ZodTypeAny>;
                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            focusedRow: {
                label: 'focusedRow',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodObject<ZodRawShape> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodObject<ZodRawShape>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.object(param)
                    }
                    return returnTypeZod as ZodObject<ZodRawShape>;
                })
            },
            onFocusedRowChange: {
                label: 'onFocusedRowChange',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);
                        returnTypeZod = z.function().args(z.object({
                            value: z.object(param),
                            data: z.array(z.object(param)),
                            totalPage: z.number(),
                            currentPage: z.number(),
                            index: z.number()
                        })).returns(z.union([z.promise(z.void()), z.void()])) as unknown as ZodFunction<ZodTuple, ZodTypeAny>

                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            },
            onRowDoubleClick: {
                label: 'onRowDoubleClick',
                component: createCustomPropertyEditor((props) => {
                    const {element, gridTemporalColumns, propertyName} = props;
                    let returnTypeZod: ZodFunction<ZodTuple, ZodTypeAny> | undefined = undefined;
                    if (element) {
                        returnTypeZod = element.property[propertyName] as ZodFunction<ZodTuple, ZodTypeAny>
                    }
                    if (gridTemporalColumns) {
                        const param = gridTemporalColumns.reduce((result, key) => {
                            result[key] = ZodSqlValue.optional();
                            return result;
                        }, {} as ZodRawShape);

                        returnTypeZod = z.function().args(z.object({
                            value: z.object(param),
                            data: z.array(z.object(param)),
                            totalPage: z.number(),
                            currentPage: z.number(),
                            index: z.number(),
                            refresh: z.function().returns(z.void())
                        })).returns(z.union([z.promise(z.void()), z.void()])) as unknown as ZodFunction<ZodTuple, ZodTypeAny>

                    }
                    return returnTypeZod as ZodFunction<ZodTuple, ZodTypeAny>;
                })
            }
        }
    }),
    faultStatusIcon: element({
        shortName: 'Status',
        icon: Icon.FaultIcon as unknown as IconType,
        property: {
            value: z.number()
        },
        component: (props, ref) => {
            const {value} = props;
            return <div ref={ref as MutableRefObject<HTMLDivElement>} style={props.style}>
                {faultToIconByStatusId(value)}
            </div>
        }
    })
} as const;

const TitleBox = forwardRef(function TitleBox(props: {
    container: Container,
    style: CSSProperties,
    onClick: () => void,
    title: string,
    dataElementId: string,
    dimension: Pick<CSSProperties, 'width' | 'height' | 'flexGrow' | 'flexShrink' | 'minWidth' | 'minHeight' | 'maxHeight' | 'maxWidth'>
}, ref) {

    const {container, onClick, style, title} = props;
    const containerStyle = useContainerStyleHook(style);
    const {elements, displayMode} = useContainerLayoutHook(container);
    return <ContainerRendererIdContext.Provider value={props.dataElementId}>
        <div style={{display: 'flex', flexDirection: 'column-reverse', ...props.dimension}}>
            <div ref={ref as LegacyRef<HTMLDivElement>}
                 style={{
                     padding: 10,
                     flexGrow: 1,
                     background: 'white',
                     boxShadow: '0 5px 10px -3px rgba(0,0,0,0.1)', ...containerStyle,
                     border: '1px solid rgba(0,0,0,0.1)',
                     borderRadius: 5
                 }}
                 data-element-id={props.dataElementId}
                 onClick={() => (displayMode.get() === 'view' && onClick ? onClick() : null)}
            >
                {elements}
            </div>
            <div style={{display: 'flex', flexDirection: 'row', paddingLeft: 10}}>
                <div style={{
                    fontSize: 'smaller',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    borderLeft: '1px solid rgba(0,0,0,0.1)',
                    borderRight: '1px solid rgba(0,0,0,0.1)',
                    paddingLeft: 5,
                    paddingTop: 3,
                    paddingRight: 5,
                    borderTopLeftRadius: 5,
                    borderTopRightRadius: 5,
                    lineHeight: 0.8, position: 'relative',
                    bottom: -1,
                    background: 'white'
                }}>{title}</div>
            </div>

        </div>
    </ContainerRendererIdContext.Provider>

})


const LayoutContainer = forwardRef(function LayoutContainer(props: {
    container: Container,
    style: CSSProperties,
    onClick: () => void,
    onMouseDown: () => void,
    onMouseUp: () => void,
    dataElementId: string,
    hidden?: boolean
}, ref) {
    const {container, onClick, onMouseUp, onMouseDown, style, hidden} = props;
    const containerStyle = useContainerStyleHook(style);
    const {elements, displayMode} = useContainerLayoutHook(container);
    const isHidden = hidden === true;
    const showElement = !isHidden;

    return <ContainerRendererIdContext.Provider value={props.dataElementId}>
        {showElement &&
            <div ref={ref as LegacyRef<HTMLDivElement>}
                 style={containerStyle}
                 data-element-id={props.dataElementId}
                 onClick={() => (displayMode.get() === 'view' && onClick ? onClick() : null)}
                 onMouseDown={() => (displayMode.get() === 'view' && onMouseDown ? onMouseDown() : null)}
                 onMouseUp={() => (displayMode.get() === 'view' && onMouseUp ? onMouseUp() : null)}
            >
                {elements}
            </div>
        }
    </ContainerRendererIdContext.Provider>
})

import {CSSProperties, ForwardedRef, forwardRef, ReactNode, useContext, useMemo, useRef} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {QueryGrid} from "../../../data/QueryGrid.tsx";
import {
    AppVariableInitializationContext,
    FormulaDependencyParameter,
    QueryType
} from "../../../designer/variable-initialization/AppVariableInitialization.tsx";
import {ColumnsConfig} from "../../../designer/panels/database/TableEditor.tsx";
import {Container} from "../../../designer/AppDesigner.tsx";
import {SqlValue} from "sql.js";
import {useShowPopUp} from "../../../../core/hooks/useShowPopUp.tsx";
import {DivWithClickOutside} from "../../../designer/components/DivWithClickOutside.tsx"
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useFormInput} from "../../useFormInput.ts";
import {utils} from "../../../../core/utils/utils.ts";
import {
    PageVariableInitializationContext
} from "../../../designer/variable-initialization/PageVariableInitialization.tsx";
import {PageViewer} from "../../../viewer/PageViewer.tsx";
import {guid} from "../../../../core/utils/guid.ts";
import {createLogger} from "../../../../core/utils/logger.ts";

const defaultRowDataToText = (data: unknown) => {
    if (typeof data === "string") {
        return data;
    }
    return JSON.stringify(data)
}
export const SelectInput = forwardRef(function SelectInput(props: {
    name?: string,
    value?: string | number,
    onChange?: (data?: string | number) => void,
    label?: string,
    query: QueryType,
    config: ColumnsConfig,
    container: Container,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    popupStyle?: CSSProperties,
    valueToRowData?: (value?: string | number) => Promise<Record<string, SqlValue>>,
    rowDataToText?: (data?: Record<string, SqlValue>) => string,
    rowDataToRenderer?: { rendererPageId?: string, rendererPageDataMapperFormula?: string },
    rowDataToValue?: (data?: Record<string, SqlValue>) => string | number,
    itemToKey?: (data?: Record<string, SqlValue>) => string | number,
    filterable?: boolean,
    pageable?: boolean,
    sortable?: boolean,
    disabled?: boolean
}, ref: ForwardedRef<HTMLLabelElement>) {
    const {
        inputStyle,
        style,
        error,
        label,
        onChange,
        value,
        config,
        container,
        query,
        valueToRowData,
        rowDataToText,
        rowDataToRenderer,
        rowDataToValue,
        itemToKey,
        name,
        popupStyle,
        filterable,
        sortable,
        pageable,
        disabled
    } = props;
    const {
        localValue,
        localError,
        handleValueChange
    } = useFormInput<typeof value, Record<string, SqlValue> | undefined>({
        name,
        value,
        error,
        disabled,
        onChange,
        valueToLocalValue: async (params) => {
            if (valueToRowData) {
                return await valueToRowData(params)
            }
        }
    });

    const context = useAppContext();
    const appSignal = useContext(AppVariableInitializationContext);
    const pageSignal = useContext(PageVariableInitializationContext);

    const isDesignMode = 'uiDisplayModeSignal' in context && context.uiDisplayModeSignal.get() === 'design';
    const propsRef = useRef({valueToRowData, rowDataToText, rowDataToValue});
    propsRef.current = {valueToRowData, rowDataToText, rowDataToValue}
    const text = (rowDataToText ? rowDataToText(localValue) : defaultRowDataToText(localValue)) ?? '';
    const showPopup = useShowPopUp();
    const rendererPageId = rowDataToRenderer?.rendererPageId ?? '';
    const rendererPageDataMapperFormula = rowDataToRenderer?.rendererPageDataMapperFormula ?? '';
    const localValueString = localValue ? JSON.stringify(localValue) : undefined;
    const renderer:ReactNode|undefined = useMemo(() => {
        const localValue = localValueString ? JSON.parse(localValueString) : undefined;
        let renderer:ReactNode|undefined = undefined;
        if (rendererPageId && rendererPageDataMapperFormula) {
            let valueParams = {value: text};
            const log = createLogger(`SelectInput:initializingVariable`)
            try {
                const app: FormulaDependencyParameter | undefined = appSignal ? appSignal.get() : undefined;
                const page: FormulaDependencyParameter | undefined = pageSignal ? pageSignal.get() : undefined;
                const fun = new Function('module', 'app', 'page', 'utils','log', rendererPageDataMapperFormula)
                const module: {
                    exports: (props: unknown) => unknown
                } = {exports: (props: unknown) => console.log(props)};
                fun.call(null, module, app, page, utils,log)
                valueParams = module.exports(localValue) as unknown as typeof valueParams;
            } catch (err) {
                log.error(err);
            }
            const page = context.allPagesSignal.get().find(p => p.id === rendererPageId);
            if (page) {
                renderer = <PageViewer
                    elements={context.elements}
                    page={page!}
                    appConfig={context.applicationSignal.get()}
                    value={valueParams}
                    navigate={context.navigate}
                    key={guid()}
                />
            }
        }
        return renderer;
    },[rendererPageId,rendererPageDataMapperFormula,localValueString]);

    return <TextInput ref={ref}
                      inputStyle={inputStyle}
                      style={style}
                      error={localError}
                      label={label}
                      value={text}
                      disabled={disabled}
                      overlayElement={renderer}
                      onFocus={async () => {
                          if (disabled) {
                              return;
                          }
                          if (isDesignMode) {
                              return;
                          }
                          const props = await showPopup<{
                              value: Record<string, SqlValue>,
                              data: Array<Record<string, SqlValue>>,
                              totalPage: number,
                              currentPage: number,
                              index: number
                          } | false, HTMLLabelElement>(ref, (closePanel, commitLayout) => {

                              return <DivWithClickOutside onClickOutside={() => {
                                  closePanel(false);
                              }}><QueryGrid query={query} columnsConfig={config}
                                            rowPerPage={10}
                                            paginationButtonCount={3}
                                            onFocusedRowChange={closePanel}
                                            style={{
                                                boxShadow: '0px 10px 8px -8px rgba(0,0,0,0.5)',
                                                paddingBottom: filterable ? 0 : 15,
                                                borderBottomLeftRadius: 10,
                                                borderBottomRightRadius: 10,
                                                borderLeft: '1px solid rgba(0,0,0,0.1)',
                                                borderRight: '1px solid rgba(0,0,0,0.1)',
                                                ...popupStyle
                                            }}
                                            focusedRow={localValue}
                                            container={container}
                                            filterable={filterable}
                                            sortable={sortable}
                                            pageable={pageable}
                                            itemToKey={itemToKey}
                                            onQueryResultChange={commitLayout}
                              /></DivWithClickOutside>
                          })
                          if (props === false) {
                              return;
                          }
                          if (propsRef.current.rowDataToValue) {
                              handleValueChange(propsRef.current.rowDataToValue(props.value));
                          }
                      }}
    />
})
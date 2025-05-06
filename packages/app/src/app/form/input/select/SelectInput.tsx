import {
    CSSProperties,
    ForwardedRef,
    forwardRef,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {QueryGrid} from "../../../data/QueryGrid.tsx";
import {
    AppVariableInitializationContext,
    FormulaDependencyParameter,
    QueryType
} from "../../../designer/variable-initialization/AppVariableInitialization.tsx";
import {Container} from "../../../designer/AppDesigner.tsx";
import {SqlValue} from "sql.js";
import {useShowPopUp} from "../../../../core/hooks/useShowPopUp.tsx";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useFormInput} from "../../useFormInput.ts";
import {utils} from "../../../../core/utils/utils.ts";
import {
    PageVariableInitializationContext
} from "../../../designer/variable-initialization/PageVariableInitialization.tsx";
import {PageViewer} from "../../../viewer/PageViewer.tsx";
import {guid} from "../../../../core/utils/guid.ts";
import {dbSchemaInitialization} from "../../../designer/variable-initialization/dbSchemaInitialization.ts";
import {useModalBox} from "../../../designer/variable-initialization/useModalBox.tsx";
import {useSignalEffect} from "react-hook-signal";
import {colors} from "../../../../core/style/colors.ts";
import {useNavigatePanel} from "../../../../core/hooks/useNavigatePanel.ts";
import {createLogger, wrapWithLog} from "../../../../core/utils/logger.ts";
import {ColumnsConfig} from "../../../designer/panels/database/SimpleTable.tsx";

const defaultRowDataToText = (data: unknown) => {
    if (typeof data === "string") {
        return data;
    }
    return JSON.stringify(data)
}

const db = dbSchemaInitialization();

const log = createLogger('select-input-error');
export const SelectInput = forwardRef(function SelectInput(props: {
    name?: string,
    value?: string | number | null,
    onChange?: (data?: string | number | null) => void,
    preventChange?: (data?: string | number | null) => Promise<boolean>,
    label?: string,
    query: QueryType,
    config: ColumnsConfig,
    container: Container,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    popupStyle?: CSSProperties,
    valueToRowData?: (value?: string | number | null) => Promise<Record<string, SqlValue>>,
    rowDataToText?: (data?: Record<string, SqlValue>) => string,
    rowDataToRenderer?: { rendererPageId?: string, rendererPageDataMapperFormula?: string },
    rowDataToValue?: (data?: Record<string, SqlValue>) => string | number,
    itemToKey?: (data?: Record<string, SqlValue>) => string | number,
    filterable?: boolean,
    pageable?: boolean,
    sortable?: boolean,
    disabled?: boolean,
    required?: boolean,
    validator?: (value?: string | number | null) => Promise<string | undefined>
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
        disabled: disabledProps,
        preventChange,
        validator,
        required,
    } = props;
    const {
        localValue,
        localError,
        handleValueChange,
        handleOnFocus,
        formContext,
        elementId,
        isDisabled,
        isBusy
    } = useFormInput<typeof value, Record<string, SqlValue> | undefined>({
        name,
        value,
        error,
        disabled: disabledProps,
        onChange,
        valueToLocalValue: async (params) => {
            if (valueToRowData) {
                return await valueToRowData(params)
            }
        },
        preventChange,
        validator,
        required,
        label
    });

    const context = useAppContext();
    const appSignal = useContext(AppVariableInitializationContext);
    const pageSignal = useContext(PageVariableInitializationContext);
    const alertBox = useModalBox();
    const navigatePanel = useNavigatePanel();
    const {allPagesSignal, applicationSignal, elements, navigate} = context;
    const isDesignMode = 'uiDisplayModeSignal' in context && context.uiDisplayModeSignal.get() === 'design';
    const propsRef = useRef({valueToRowData, rowDataToText, rowDataToValue});
    propsRef.current = {valueToRowData, rowDataToText, rowDataToValue}
    const text = (rowDataToText ? rowDataToText(localValue) : defaultRowDataToText(localValue)) ?? '';
    const showPopup = useShowPopUp();
    const rendererPageId = rowDataToRenderer?.rendererPageId ?? '';
    const rendererPageDataMapperFormula = rowDataToRenderer?.rendererPageDataMapperFormula ?? '';
    const localValueString = localValue ? JSON.stringify(localValue) : undefined;
    const renderer: ReactNode | undefined = useMemo(() => {
        const localValue = localValueString ? JSON.parse(localValueString) : undefined;
        let renderer: ReactNode | undefined = undefined;
        if (rendererPageId && rendererPageDataMapperFormula) {
            let valueParams = {value: text};
            try {
                const app: FormulaDependencyParameter | undefined = appSignal ? appSignal.get() : undefined;
                const page: FormulaDependencyParameter | undefined = pageSignal ? pageSignal.get() : undefined;
                const fun = new Function('module', 'app', 'page', 'utils',  'db', 'alertBox', 'navigate', 'navigatePanel', wrapWithLog(rendererPageDataMapperFormula))
                const module: {
                    exports: (props: unknown) => unknown
                } = {
                    exports: () => {
                    }
                };
                fun.call(null, module, app, page, utils, db, alertBox, navigate, navigatePanel)
                valueParams = module.exports(localValue) as unknown as typeof valueParams;
            } catch (err) {
                log.error(err,rendererPageDataMapperFormula);
            }
            const page = allPagesSignal.get().find(p => p.id === rendererPageId);
            if (page) {
                renderer = <PageViewer
                    elements={elements}
                    page={page!}
                    appConfig={applicationSignal.get()}
                    value={valueParams}
                    navigate={navigate}
                    key={guid()}
                />
            }
        }
        return renderer;
    }, [rendererPageId, rendererPageDataMapperFormula, localValueString, appSignal, pageSignal, allPagesSignal, applicationSignal, elements, navigate, name, text, alertBox]);

    const [isFocused, setIsFocused] = useState(false);
    useSignalEffect(() => {
        const isFocused = formContext?.focusedElementId.get() === elementId;
        setIsFocused(isFocused)
    })
    const iStyle = useMemo(() => {
        const style = {...inputStyle} as CSSProperties;
        if (isFocused) {
            style.background = colors.lightYellow
        }
        return style;
    }, [inputStyle, isFocused]);
    const popupVisibleRef = useRef(false);

    async function onFocus() {
        if (popupVisibleRef.current) {
            return;
        }
        if (isDisabled) {
            return;
        }
        if (isDesignMode) {
            return;
        }
        popupVisibleRef.current = true;
        handleOnFocus();
        const props = await showPopup<{
            value: Record<string, SqlValue>,
            data: Array<Record<string, SqlValue>>,
            totalPage: number,
            currentPage: number,
            index: number
        } | false, HTMLLabelElement>(ref, (closePanel, commitLayout) => {
            return <QueryGrid query={query} columnsConfig={config}
                              onClickOutside={() => closePanel(false)}
                              rowPerPage={10}
                              paginationButtonCount={3}
                              onFocusedRowChange={closePanel}
                              style={{background:'white',...popupStyle}}
                              focusedRow={localValue}
                              container={container}
                              filterable={filterable}
                              sortable={sortable}
                              pageable={pageable}
                              itemToKey={itemToKey}
                              onQueryResultChange={commitLayout}

            />
        });
        popupVisibleRef.current = false;
        if (props === false) {
            formContext?.focusedElementId.set(undefined);
            return;
        }
        if (propsRef.current.rowDataToValue) {
            await handleValueChange(propsRef.current.rowDataToValue(props.value));
        }
        if (formContext?.focusNext) {
            //formContext?.focusNext()
        }
    }

    const onFocusRef = useRef(onFocus);
    onFocusRef.current = onFocus;
    useEffect(() => {
        if (isFocused) {
            onFocusRef.current().then()
        }
    }, [isFocused]);
    return <TextInput ref={ref}
                      inputStyle={iStyle}
                      style={style}
                      error={localError}
                      label={label}
                      value={text}
                      busy={isBusy}
                      disabled={isDisabled}
                      overlayElement={renderer}
                      enableClearIcon={!utils.isEmpty(localValue)}
                      onClearIconClicked={() => handleValueChange(null)}
                      onFocus={onFocus}
    />
})
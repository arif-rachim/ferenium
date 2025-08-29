import {CSSProperties, ForwardedRef, forwardRef, useEffect, useMemo, useRef, useState} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {format_ddMMMyyyy, toDate} from "../../../../core/utils/dateFormat.ts";
import {DatePicker} from "./DatePicker.tsx";
import {isDate} from "./isDate.ts";
import {useShowPopUp} from "../../../../core/hooks/useShowPopUp.tsx";
import {useForwardedRef} from "../../../../core/hooks/useForwardedRef.ts";
import {DivWithClickOutside} from "../../../designer/components/DivWithClickOutside.tsx"
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useFormInput} from "../../useFormInput.ts";
import {useSignalEffect} from "react-hook-signal";
import {colors} from "../../../../core/style/colors.ts";
import {utils} from "../../../../core/utils/utils.ts";

export type DateOrString = Date | string | null

export const DateInput = forwardRef(function DateInput<T extends DateOrString>(props: {
    name?: string,
    value?: T,
    minValue?:T,
    maxValue?:T,
    onChange?: (value?: T) => void,
    disabled?: boolean,
    required?: boolean,
    label?: string,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    validator?:(value?:unknown) => Promise<string|undefined>,
}, forwardedRef: ForwardedRef<HTMLLabelElement>) {
    const ref = useForwardedRef(forwardedRef);
    const {inputStyle, style, error, label, onChange, value, disabled, validator, name , required, minValue, maxValue} = props;
    const {localValue, localError, handleValueChange,isDisabled,isBusy,handleOnFocus,formContext,elementId} = useFormInput<T, Date>({
        name,
        value,
        error,
        valueToLocalValue: param => toDate(param),
        onChange,
        validator,
        required,
        disabled,
        label
    });
    const context = useAppContext();
    const isDesignMode = 'uiDisplayModeSignal' in context && context.uiDisplayModeSignal.get() === 'design';
    const propsRef = useRef({userIsChangingData: false});
    const text = format_ddMMMyyyy(localValue);
    const showPopup = useShowPopUp();
    const [isFocused,setIsFocused] = useState(false);
    useSignalEffect(() => {
        setIsFocused(formContext?.focusedElementId.get() === elementId)
    })
    const iStyle = useMemo(() => {
        const style = {width: 90, textAlign: 'center',...inputStyle} as CSSProperties;
        if(isFocused){
            style.background = colors.lightYellow
        }
        return style;
    }, [inputStyle,isFocused]);
    const popupVisibleRef = useRef(false);
    async function onFocus(){
        if(popupVisibleRef.current){
            return;
        }
        if (isDesignMode) {
            return;
        }
        popupVisibleRef.current = true;
        handleOnFocus();
        const newDate = await showPopup<Date | false, HTMLLabelElement>(ref, (closePanel, commitLayout) => {
            commitLayout();
            return <DivWithClickOutside style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderBottomRightRadius: 5,
                borderBottomLeftRadius: 5,
                overflow:'hidden',
                boxShadow: '0px 10px 5px -3px rgba(0,0,0,0.5)'
            }} onMouseDown={(e) => {
                e.preventDefault()
            }} onClickOutside={() => {
                closePanel(false);
            }}><DatePicker onChange={(newDate) => closePanel(newDate)}
                           value={localValue}
                           minValue={utils.toDate(minValue)}
                           maxValue={utils.toDate(maxValue)}/></DivWithClickOutside>
        })
        popupVisibleRef.current = false;
        if (newDate === false) {
            formContext?.focusedElementId.set(undefined);
            return;
        }
        const typeIsString = typeof value === 'string';
        const val = typeIsString ? format_ddMMMyyyy(newDate) : newDate;
        await handleValueChange(val as T)

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
                      disabled={isDisabled || isBusy}
                      error={localError}
                      label={label}
                      value={text}
                      onFocus={onFocus}
                      onBlur={async (newVal) => {
                          if (propsRef.current.userIsChangingData) {
                              propsRef.current.userIsChangingData = false;
                              const date = toDate(newVal);
                              if (isDate(date)) {
                                  const typeIsString = typeof value === 'string';
                                  const val = typeIsString ? format_ddMMMyyyy(date) : date;
                                  await handleValueChange(val as T)
                              }
                          }
                      }}
                      onKeyDown={() => {
                          propsRef.current.userIsChangingData = true;
                      }}
                      enableClearIcon={!utils.isEmpty(text)}
                      onClearIconClicked={() => handleValueChange(null as T)}
    />
})
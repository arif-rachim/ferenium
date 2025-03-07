import {CSSProperties, ForwardedRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {dateToString, format_ddMMMyyyy, toDate} from "../../../../core/utils/dateFormat.ts";
import {DateRangePicker} from "./DateRangePicker.tsx";
import {Label} from "../../Label.tsx";
import {BORDER, BORDER_ERROR} from "../../../../core/style/Border.ts";
import {isDate} from "./isDate.ts";
import {TextInput} from "../text/TextInput.tsx";
import {useShowPopUp} from "../../../../core/hooks/useShowPopUp.tsx";
import {useForwardedRef} from "../../../../core/hooks/useForwardedRef.ts";
import {DivWithClickOutside} from "../../../designer/components/DivWithClickOutside.tsx"
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useFormInput} from "../../useFormInput.ts";
import {useSignalEffect} from "react-hook-signal";
import {colors} from "../../../../core/style/colors.ts";

type RangeInput = { from: Date | string, to: Date | string };

function isString(val: unknown): val is string {
    return typeof val === 'string'
}

export const DateRangeInput = forwardRef(function DateRangeInput(props: {
    name?: string,
    value?: RangeInput,
    onChange?: (value?: RangeInput) => void,
    label?: string,
    error?: string,
    disabled?: boolean,
    required?: boolean,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    validator?: (value?: unknown) => Promise<string | undefined>,
}, forwardedRef: ForwardedRef<HTMLLabelElement>) {
    const ref = useForwardedRef(forwardedRef);
    const {inputStyle, style: defaultStyle, error, label, onChange, value, name, disabled, validator, required} = props;
    const {
        handleValueChange,
        localValue,
        setLocalValue,
        localError,
        formContext,
        isBusy,
        isDisabled,
        handleOnFocus,
        elementId
    } = useFormInput<RangeInput, { from?: string, to?: string }>({
        name,
        value,
        error,
        valueToLocalValue: value => {
            return {from: format_ddMMMyyyy(value?.from), to: format_ddMMMyyyy(value?.to)}
        },
        onChange,
        disabled,
        required,
        validator,
        label
    });
    const context = useAppContext();
    const isDesignMode = 'uiDisplayModeSignal' in context && context.uiDisplayModeSignal.get() === 'design';
    const propsRef = useRef({onChange, value});
    propsRef.current = {onChange, value};

    useEffect(() => {
        const value = propsRef.current.value;
        if (localValue && localValue.from && localValue.from.length === '01-JAN-1970'.length && localValue.to && localValue.to.length === '01-JAN-1970'.length) {
            const fromIsString = isString(value?.from);
            const toIsString = isString(value?.to);
            const from = toDate(localValue.from);
            const to = toDate(localValue.to);
            const fromIsChanged = value === undefined ||
                (fromIsString && dateToString(from) !== value.from) || (isDate(value.from) && dateToString(from) !== dateToString(value.from));
            const toIsChanged = value === undefined ||
                (toIsString && dateToString(to) !== value.to) || (isDate(value.to) && dateToString(to) !== dateToString(value.to));
            const shouldTriggerChange = fromIsChanged || toIsChanged;
            const val = {
                from: (fromIsString ? dateToString(from) : from) as string,
                to: (toIsString ? dateToString(to) : to) as string
            };
            if (shouldTriggerChange) {
                handleValueChange(val).then();
            }
        }
    }, [setLocalValue, formContext, localValue, name, handleValueChange]);


    const showPopup = useShowPopUp();
    const popupVisibleRef = useRef(false);
    const localValueTo = localValue?.to;
    const localValueFrom = localValue?.from;
    const onFocus = useCallback(async function onFocus() {
        if (popupVisibleRef.current) {
            return;
        }
        if (isDesignMode) {
            return;
        }
        popupVisibleRef.current = true;
        handleOnFocus();
        const newDate = await showPopup<{
            from: Date,
            to: Date
        } | false, HTMLLabelElement>(ref, (closePanel, commitLayout) => {
            commitLayout();
            return <DivWithClickOutside style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                padding: 10,
                marginTop: 1,
                borderBottomRightRadius: 5,
                borderBottomLeftRadius: 5,
                width: 500,
                boxShadow: '0px 10px 5px -3px rgba(0,0,0,0.5)'
            }} onClickOutside={() => closePanel(false)}>
                <DateRangePicker onChange={closePanel}
                                 value={{from: toDate(localValueFrom) as Date, to: toDate(localValueTo) as Date}}/>
            </DivWithClickOutside>
        });
        popupVisibleRef.current = false;
        if (newDate === false) {
            return;
        }
        setLocalValue({from: format_ddMMMyyyy(newDate.from), to: format_ddMMMyyyy(newDate.to)})
    }, [handleOnFocus, isDesignMode, localValueFrom, localValueTo, ref, setLocalValue, showPopup]);
    const [isFocused, setIsFocused] = useState(false);

    useSignalEffect(() => {
        setIsFocused(formContext?.focusedElementId.get() === elementId)
    })
    const iStyle = useMemo(() => {
        const style = {
            border: error ? BORDER_ERROR : BORDER,
            padding: '0px 5px',
            borderRadius: 5,
            width: 90,
            textAlign: 'center',
            ...inputStyle
        } as CSSProperties
        if (style?.border === 'unset') {
            style.border = BORDER
        }
        if (isFocused) {
            style.background = colors.lightYellow
        }
        return style;
    }, [inputStyle, isFocused, error]);
    return <Label label={label} ref={ref} style={defaultStyle}>
        <div style={{display: 'flex', gap: 10}}>
            <TextInput
                disabled={isDisabled || isBusy}
                value={localValue?.from}
                onChange={val => {
                    setLocalValue(old => ({...old, from: val}))
                }}
                inputStyle={iStyle}
                onFocus={onFocus}

            />
            <TextInput
                disabled={isDisabled || isBusy}
                value={localValue?.to}
                onChange={val => {
                    setLocalValue(old => ({...old, to: val}))
                }}
                inputStyle={iStyle}
                onFocus={onFocus}
            />
        </div>

        {localError && <div style={{
            padding: '0 5px',
            fontSize: 'small',
            lineHeight: 1,
            color: '#C00000',
            textAlign: 'right'
        }}>{localError}</div>}
    </Label>

})
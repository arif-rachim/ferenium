import {CSSProperties, ForwardedRef, forwardRef, useEffect, useRef} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {dateToString, format_ddMMMyyyy, format_hhmm, toDate} from "../../../../core/utils/dateFormat.ts";
import {DatePicker} from "./DatePicker.tsx";
import {Label} from "../../Label.tsx";
import {isDate} from "./isDate.ts";
import {useShowPopUp} from "../../../../core/hooks/useShowPopUp.tsx";
import {useForwardedRef} from "../../../../core/hooks/useForwardedRef.ts";
import {DivWithClickOutside} from "../../../designer/components/DivWithClickOutside.tsx"
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {useFormInput} from "../../useFormInput.ts";
import {utils} from "../../../../core/utils/utils.ts";

const ERROR_COLOR = '#C00000';

export const DateTimeInput = forwardRef(function DateTimeInput(props: {
    name?: string,
    value?: Date | string,
    onChange?: (value?: Date | string) => void,
    disabled?: boolean,
    label?: string,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    required?: boolean,
    validator?: (value?: unknown) => Promise<string | undefined>,
    elementId?: string
}, forwardedRef: ForwardedRef<HTMLLabelElement>) {

    const ref = useForwardedRef(forwardedRef);
    const {inputStyle, style, error, label, onChange, value, name, disabled, validator, required, elementId} = props;
    const {
        localValue,
        setLocalValue,
        localError,
        formContext,
        handleValueChange,
        isDisabled,
        isBusy
    } = useFormInput<typeof value, {
        date?: string,
        hour?: string,
        minute?: string
    }>({
        name,
        value,
        error,
        valueToLocalValue: param => {
            const result = toDate(param);
            const date = result ? format_ddMMMyyyy(result) : undefined;
            const hour = result ? format_hhmm(result).substring(0, 2) : undefined;
            const minute = result ? format_hhmm(result).substring(3, 5) : undefined;
            return {date, hour, minute};
        },
        valueIsEqual: (prev, next) => {
            return JSON.stringify(prev) === JSON.stringify(next);
        },
        validator,
        required,
        disabled,
        label,
        elementId,
        onChange
    });
    const context = useAppContext();
    const isDesignMode = 'uiDisplayModeSignal' in context && context.uiDisplayModeSignal.get() === 'design';
    const propsRef = useRef({onChange, value, handleValueChange});
    propsRef.current = {onChange, value, handleValueChange};

    useEffect(() => {
        const value = propsRef.current.value;
        const handleValueChange = propsRef.current.handleValueChange;
        const valueIsString = typeof value === 'string';
        if (localValue && localValue.hour && localValue.minute && localValue.date
            && localValue.date.length >= '1-JAN-1970'.length
            && localValue.hour.length == 2
            && localValue.minute.length == 2) {
            const dateValue = toDate(`${localValue.date} ${localValue.hour}:${localValue.minute}`) as Date;
            if (isDate(dateValue)) {
                const shouldTriggerChange = value === undefined || (valueIsString && dateToString(dateValue) !== value) || (isDate(value) && dateToString(dateValue) !== dateToString(value));
                const val = valueIsString ? dateToString(dateValue) : dateValue;
                if (shouldTriggerChange) {
                    handleValueChange(val).then();
                }
            }
        }
    }, [setLocalValue, formContext, localValue, name]);

    const showPopup = useShowPopUp();
    const firstSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const secondSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const trapHowManyTimesUserTypeKeyDown = useRef(0);
    return <Label ref={ref} label={label} style={{...style, flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-end'}}>
            <TextInput
                disabled={isDisabled || isBusy}
                error={localError}
                inputStyle={{
                    width: 90,
                    textAlign: 'center',
                    borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)',
                    ...inputStyle
                }}
                enableClearIcon={!utils.isEmpty(localValue?.date)}
                onClearIconClicked={async () => {
                    await handleValueChange(undefined);
                    setLocalValue({})
                }}
                value={localValue?.date}
                onChange={val => {
                    setLocalValue(prev => {
                        const next = ({...prev, date: val});
                        if (next.date !== prev?.date) {
                            return next;
                        }
                        return prev;
                    });
                }}
                onFocus={async () => {
                    if (isDesignMode) {
                        return
                    }
                    const newDate = await showPopup<Date | false | undefined, HTMLLabelElement>(ref, (closePanel, commitLayout) => {
                        commitLayout();
                        return <DivWithClickOutside style={{
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'white',
                            padding: 10,
                            marginTop: 1,
                            borderBottomRightRadius: 5,
                            borderBottomLeftRadius: 5,
                            width: 270,
                            boxShadow: '0px 10px 5px -3px rgba(0,0,0,0.5)'
                        }} onMouseDown={(e) => {
                            e.preventDefault()
                        }} onClickOutside={() => closePanel(false)}><DatePicker onChange={closePanel}
                                                                                value={toDate(localValue?.date)}/></DivWithClickOutside>
                    });
                    if (newDate === false) {
                        return;
                    }
                    setLocalValue(prev => {
                        const next = ({...prev, date: format_ddMMMyyyy(newDate)});
                        if (next.date !== prev?.date) {
                            return next
                        }
                        return prev
                    })
                    if (firstSegmentTimeRef.current) {
                        firstSegmentTimeRef.current.focus();
                    }
                }}
            />
            <div style={{display: 'flex', flexDirection: 'row', position: 'relative'}}>
                <TextInput
                    disabled={isDisabled || isBusy}
                    inputRef={firstSegmentTimeRef}
                    inputStyle={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRight: 'unset',
                        textAlign: 'right',
                        borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)',
                        ...inputStyle
                    }}
                    value={localValue?.hour}
                    style={{width: 30}}
                    maxLength={2}
                    onChange={e => setLocalValue(prev => {
                        const next = ({...prev, hour: e});
                        if (next.hour !== prev?.hour) {
                            return next;
                        }
                        return prev;
                    })}
                    onKeyUp={() => {
                        trapHowManyTimesUserTypeKeyDown.current += 1;
                        if (trapHowManyTimesUserTypeKeyDown.current === 2 && secondSegmentTimeRef.current) {
                            trapHowManyTimesUserTypeKeyDown.current = 0;
                            secondSegmentTimeRef.current.focus()
                            return;
                        }
                    }}
                />
                <div style={{
                    position: 'absolute',
                    left: 29,
                    bottom: 5
                }}>
                    {':'}
                </div>
                <TextInput
                    disabled={isDisabled || isBusy}
                    inputRef={secondSegmentTimeRef}
                    inputStyle={{
                        ...inputStyle,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderLeft: 'unset',
                        textAlign: 'left',
                        borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'
                    }}
                    value={localValue?.minute}
                    style={{width: 30}}
                    maxLength={2}
                    onChange={e => setLocalValue(prev => {
                        const next = ({...prev, minute: e});
                        if (next.minute !== prev?.minute) {
                            return next;
                        }
                        return prev;
                    })}
                />
            </div>
        </div>
    </Label>
})

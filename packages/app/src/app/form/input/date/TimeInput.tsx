import {CSSProperties, ForwardedRef, forwardRef, useEffect, useRef} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {Label} from "../../Label.tsx";
import {useForwardedRef} from "../../../../core/hooks/useForwardedRef.ts";
import {useFormInput} from "../../useFormInput.ts";
import {utils} from "../../../../core/utils/utils.ts";
import {isEmpty} from "../../../../core/utils/isEmpty.ts";
import {isNotEmpty} from "../../../../core/utils/isNotEmpty.ts";
import {isNumberAble} from "../../../../core/utils/isNumberAble.ts";

const ERROR_COLOR = '#C00000';
export const TimeInput = forwardRef(function TimeInput(props: {
    name?: string,
    value?: number | string,
    onChange?: (value?: number | string) => void,
    disabled?: boolean,
    label?: string,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    required?: boolean,
    validator?: (value?: unknown) => Promise<string | undefined>
}, forwardedRef: ForwardedRef<HTMLLabelElement>) {

    const ref = useForwardedRef(forwardedRef);
    const {inputStyle, style, error, label, onChange, value, name, disabled, validator, required} = props;
    const {
        localValue,
        setLocalValue,
        localError,
        formContext,
        handleValueChange,
        isDisabled,
        isBusy,
        handleOnFocus
    } = useFormInput<typeof value, {
        hour?: string,
        minute?: string
    }>({
        name,
        value,
        error,
        valueToLocalValue: param => {
            param = utils.toNumber(param);
            if (param && param >= 0) {
                const hour = utils.startPad(Math.floor(param / 60), 1);
                const minute = utils.startPad((param % 60), 2);
                return {hour, minute};
            }
            return {hour: '', minute: ''}
        },
        valueIsEqual: (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
        validator,
        required,
        disabled,
        label,
        onChange
    });
    const propsRef = useRef({onChange, value, handleValueChange});
    propsRef.current = {onChange, value, handleValueChange};
    useEffect(() => {
        const value = propsRef.current.value;
        const handleValueChange = propsRef.current.handleValueChange;
        const valueIsString = typeof value === 'string';
        if (localValue && localValue.hour && localValue.hour.length > 0 && localValue.minute && localValue.minute.length == 2) {
            const timeValue = (parseInt(localValue.hour) * 60) + parseInt(localValue.minute)
            const shouldTriggerChange = value === undefined || (timeValue.toString() !== value.toString());
            const val = valueIsString ? timeValue.toString() : timeValue;
            if (shouldTriggerChange) {
                handleValueChange(val, true).then();
            }
        }
    }, [setLocalValue, formContext, localValue, name]);
    const firstSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const secondSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const cursorMinutesPosition = useRef<number>(0);
    const cursorHoursPosition = useRef<number>(0);
    return <Label ref={ref} label={label} style={{width: 60, ...style, flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', position: 'relative'}}>
            <TextInput
                disabled={isDisabled || isBusy}
                type={'text'}
                inputRef={firstSegmentTimeRef}
                debounceChangeEvent={0}
                inputStyle={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRight: 'unset',
                    textAlign: 'right',
                    paddingRight: 4,
                    borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)',
                    ...inputStyle
                }}
                value={localValue?.hour}
                style={{width: '50%'}}
                onFocus={(_, event) => {
                    if (handleOnFocus) {
                        handleOnFocus(event)
                    }
                    if (handleOnFocus) {
                        handleOnFocus(event)
                        let position = firstSegmentTimeRef?.current?.selectionStart ?? 0;
                        if(position && _ && position === _.length) {
                            position = position - 1;
                        }
                        cursorHoursPosition.current = position;
                        if(firstSegmentTimeRef.current) {
                            firstSegmentTimeRef.current.setSelectionRange(position,position+1);
                        }
                    }
                }}
                onKeyDown={(_,e) => {
                    const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                    if(!isAllowed){
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                onKeyUp={(_, e) => {
                    const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                    if(isAllowed) {
                        let position = firstSegmentTimeRef?.current?.selectionStart ?? 0;
                        if(e.key === 'ArrowLeft') {
                            position = position - 1;
                        }
                        if(e.key === 'ArrowRight') {
                            if(position && _ && position === _.length && secondSegmentTimeRef.current) {
                                secondSegmentTimeRef.current.focus();
                                return;
                            }
                        }
                        cursorHoursPosition.current = position;
                        if(firstSegmentTimeRef.current) {
                            firstSegmentTimeRef.current.setSelectionRange(position,position+1);
                        }
                    }
                }}
                onChange={value => setLocalValue(prev => {
                    const next = ({...prev, hour: value});
                    if (next.hour !== prev?.hour) {
                        if (isNotEmpty(next.hour) && isEmpty(next.minute)) {
                            next.minute = '00';
                        }
                        return next;
                    }
                    return prev;
                })}
                onBlur={() => {
                    if(localValue?.hour && parseInt(localValue.hour) === 0 && localValue.hour !== '0') {
                        setLocalValue(prev => {
                            return {
                                hour : '0',
                                minute : prev.minute
                            }
                        })
                    }
                }}
            />
            <div style={{
                borderTop: `1px solid ${localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'}`,
                borderBottom: `1px solid ${localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'}`,
                bottom: 5,
                ...inputStyle,
                background: (isDisabled || isBusy) ? 'rgba(0,0,0,0.04)' : 'unset',
            }}>
                {':'}
            </div>
            <TextInput
                disabled={isDisabled || isBusy}
                inputRef={secondSegmentTimeRef}
                type={'text'}
                inputStyle={{
                    ...inputStyle,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderLeft: 'unset',
                    textAlign: 'left',
                    paddingLeft: 3,
                    borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'
                }}
                value={localValue?.minute}
                style={{width: '50%'}}
                maxLength={2}
                onFocus={(_, event) => {
                    if (handleOnFocus) {
                        handleOnFocus(event)
                        cursorMinutesPosition.current = secondSegmentTimeRef?.current?.selectionStart ?? 0;
                        if(secondSegmentTimeRef.current) {
                            secondSegmentTimeRef.current.setSelectionRange(cursorMinutesPosition.current,cursorMinutesPosition.current+1);
                        }

                    }
                }}
                onKeyDown={(_,e) => {
                    const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                    if(!isAllowed){
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                onKeyUp={(_, e) => {
                    const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                    if(isAllowed) {
                        let position = secondSegmentTimeRef?.current?.selectionStart ?? 0;
                        if(e.key === 'ArrowLeft') {
                            if(position === 0) {
                                const endOfRange = firstSegmentTimeRef.current?.value?.length ?? 0;
                                if(firstSegmentTimeRef.current) {
                                    firstSegmentTimeRef.current.setSelectionRange(endOfRange - 1,endOfRange);
                                    firstSegmentTimeRef.current.focus()
                                }
                                return;
                            }
                            position -= position;
                        }
                        cursorMinutesPosition.current = position;
                        if(secondSegmentTimeRef.current) {
                            secondSegmentTimeRef.current.setSelectionRange(position,position+1);
                        }
                    }
                }}
                onChange={value => setLocalValue(prev => {
                    const next = ({...prev, minute: value});
                    if (next.minute !== prev?.minute) {
                        return next;
                    }
                    return prev;
                })}
            />
        </div>
    </Label>
})
export const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'];
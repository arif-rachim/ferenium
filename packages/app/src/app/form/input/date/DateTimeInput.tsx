import {CSSProperties, ForwardedRef, forwardRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
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
import {useSignalEffect} from "react-hook-signal";
import {colors} from "../../../../core/style/colors.ts";
import {DateOrString} from "./DateInput.tsx";
import {isNumberAble} from "../../../../core/utils/isNumberAble.ts";
import {allowedKeys} from "./TimeInput.tsx";
import {isNotEmpty} from "../../../../core/utils/isNotEmpty.ts";
import {isEmpty} from "../../../../core/utils/isEmpty.ts";

const ERROR_COLOR = '#C00000';

export const DateTimeInput = forwardRef(function DateTimeInput<T extends DateOrString>(props: {
    name?: string,
    value?: T,
    minValue?: T,
    maxValue?: T,
    onChange?: (value?: T) => void,
    disabled?: boolean,
    label?: string,
    error?: string,
    style?: CSSProperties,
    inputStyle?: CSSProperties,
    required?: boolean,
    validator?: (value?: unknown) => Promise<string | undefined>,
}, forwardedRef: ForwardedRef<HTMLLabelElement>) {

    const ref = useForwardedRef(forwardedRef);
    const {
        inputStyle,
        style,
        error,
        label,
        onChange,
        value,
        minValue,
        maxValue,
        name,
        disabled,
        validator,
        required
    } = props;
    const {
        localValue,
        setLocalValue,
        localError,
        formContext,
        handleValueChange,
        isDisabled,
        isBusy,
        handleOnFocus,
        elementId
    } = useFormInput<T, {
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
                    handleValueChange(val as T, true).then();
                }
            }
        }
    }, [setLocalValue, formContext, localValue, name]);

    const showPopup = useShowPopUp();
    const firstSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const secondSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const cursorMinutesPosition = useRef<number>(0);
    const cursorHoursPosition = useRef<number>(0);


    const [isFocused, setIsFocused] = useState(false);
    useSignalEffect(() => {
        setIsFocused(formContext?.focusedElementId.get() === elementId)
    })
    const iStyle = useMemo(() => {
        const style = {
            width: 90,
            textAlign: 'center',
            borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)',
            ...inputStyle
        } as CSSProperties
        if (isFocused) {
            style.background = colors.lightYellow
        }
        return style;
    }, [inputStyle, isFocused, localError]);
    const popupVisibleRef = useRef(false);
    const localValueDate = localValue?.date;
    const onFocus = useCallback(async function onFocus() {
        if (popupVisibleRef.current) {
            return
        }
        if (isDesignMode) {
            return
        }
        popupVisibleRef.current = true;
        handleOnFocus();
        const newDate = await showPopup<Date | false | undefined, HTMLLabelElement>(ref, (closePanel, commitLayout) => {
            commitLayout();
            return <DivWithClickOutside style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderBottomRightRadius: 5,
                borderBottomLeftRadius: 5,
                boxShadow: '0px 10px 5px -3px rgba(0,0,0,0.5)'
            }} onMouseDown={(e) => {
                e.preventDefault()
            }} onClickOutside={() => closePanel(false)}><DatePicker onChange={closePanel}
                                                                    value={toDate(localValueDate)}
                                                                    minValue={utils.toDate(minValue)}
                                                                    maxValue={utils.toDate(maxValue)}/>
            </DivWithClickOutside>
        });
        popupVisibleRef.current = false;
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
    }, [handleOnFocus, isDesignMode, localValueDate, ref, setLocalValue, showPopup]);
    return <Label ref={ref} label={label} style={{...style, flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-end'}}>
            <TextInput
                disabled={isDisabled || isBusy}
                error={localError}
                inputStyle={iStyle}
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
                onFocus={onFocus}
            />
            <div style={{display: 'flex', flexDirection: 'row', position: 'relative'}}>
                <TextInput
                    disabled={isDisabled || isBusy}
                    inputRef={firstSegmentTimeRef}
                    type={'text'}
                    debounceChangeEvent={0}
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
                    onFocus={(_, event) => {
                        if (handleOnFocus) {
                            handleOnFocus(event)
                        }
                        if (handleOnFocus) {
                            handleOnFocus(event)
                            let position = firstSegmentTimeRef?.current?.selectionStart ?? 0;
                            if (position && _ && position === _.length) {
                                position = position - 1;
                            }
                            cursorHoursPosition.current = position;
                            if (firstSegmentTimeRef.current) {
                                firstSegmentTimeRef.current.setSelectionRange(position, position + 1);
                            }

                        }
                    }}
                    onKeyDown={(_, e) => {
                        const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                        if (!isAllowed) {
                            e.preventDefault();
                            e.stopPropagation();
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
                    onKeyUp={(_, e) => {
                        const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                        if (isAllowed) {
                            let position = firstSegmentTimeRef?.current?.selectionStart ?? 0;
                            if (e.key === 'ArrowLeft') {
                                position = position - 1;
                            }
                            // if(e.key === 'ArrowRight') {
                            if (position && _ && position === _.length && _.length == 2 && secondSegmentTimeRef.current) {
                                secondSegmentTimeRef.current.setSelectionRange(0, 1);
                                secondSegmentTimeRef.current.focus();
                                return;
                            }
                            // }
                            cursorHoursPosition.current = position;
                            if (firstSegmentTimeRef.current) {
                                firstSegmentTimeRef.current.setSelectionRange(position, position + 1);
                            }

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
                        borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'
                    }}
                    value={localValue?.minute}
                    style={{width: 30}}
                    maxLength={2}
                    onFocus={(_, event) => {
                        if (handleOnFocus) {
                            handleOnFocus(event)
                            cursorMinutesPosition.current = secondSegmentTimeRef?.current?.selectionStart ?? 0;
                            if(secondSegmentTimeRef.current) {
                                secondSegmentTimeRef.current.setSelectionRange(cursorMinutesPosition.current, cursorMinutesPosition.current + 1);
                            }
                        }
                    }}
                    onKeyDown={(_, e) => {
                        const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                        if (!isAllowed) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                    onKeyUp={(_, e) => {
                        const isAllowed = allowedKeys.includes(e.key) || isNumberAble(e.key)
                        if (isAllowed) {
                            let position = secondSegmentTimeRef?.current?.selectionStart ?? 0;
                            if (e.key === 'ArrowLeft') {
                                if (position === 0) {
                                    const endOfRange = firstSegmentTimeRef.current?.value?.length ?? 0;
                                    if(firstSegmentTimeRef.current) {
                                        firstSegmentTimeRef.current.setSelectionRange(endOfRange - 1, endOfRange);
                                        firstSegmentTimeRef.current.focus()
                                        return;
                                    }
                                }
                                position -= position;
                            }
                            cursorMinutesPosition.current = position;
                            if (secondSegmentTimeRef.current) {
                                secondSegmentTimeRef.current.setSelectionRange(position, position + 1);
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
        </div>
    </Label>
})

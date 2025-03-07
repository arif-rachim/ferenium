import {CSSProperties, ForwardedRef, forwardRef, useEffect, useRef} from "react";
import {TextInput} from "../text/TextInput.tsx";
import {Label} from "../../Label.tsx";
import {useForwardedRef} from "../../../../core/hooks/useForwardedRef.ts";
import {useFormInput} from "../../useFormInput.ts";
import {utils} from "../../../../core/utils/utils.ts";

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
                const hour = utils.startPad(Math.floor(param/60),1);
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
                handleValueChange(val).then();
            }
        }
    }, [setLocalValue, formContext, localValue, name]);
    const firstSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    const secondSegmentTimeRef = useRef<HTMLInputElement | undefined>();
    return <Label ref={ref} label={label} style={{width:60,...style,flexDirection: 'column'}}>
        <div style={{display: 'flex', flexDirection: 'row', position: 'relative'}}>
            <TextInput
                disabled={isDisabled || isBusy}
                inputRef={firstSegmentTimeRef}
                inputStyle={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRight: 'unset',
                    textAlign: 'right',
                    paddingRight:4,
                    borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)',
                    ...inputStyle
                }}
                value={localValue?.hour}
                style={{width: '50%'}}
                onFocus={handleOnFocus}
                onChange={e => setLocalValue(prev => {
                    const next = ({...prev, hour: e});
                    if (next.hour !== prev?.hour) {
                        return next;
                    }
                    return prev;
                })}
            />
            <div style={{
                borderTop: `1px solid ${localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'}`,
                borderBottom: `1px solid ${localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'}`,
                bottom: 5,
                background: disabled ? 'rgba(0,0,0,0.03)' : 'unset',
                ...inputStyle
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
                    paddingLeft:3,
                    borderColor: localError ? ERROR_COLOR : 'rgba(0,0,0,0.1)'
                }}
                value={localValue?.minute}
                style={{width: '50%'}}
                maxLength={2}
                onFocus={handleOnFocus}
                onChange={e => setLocalValue(prev => {
                    const next = ({...prev, minute: e});
                    if (next.minute !== prev?.minute) {
                        return next;
                    }
                    return prev;
                })}
            />
        </div>
    </Label>
})

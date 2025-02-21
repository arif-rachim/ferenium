import {Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState, useTransition} from "react";
import {useSignal, useSignalEffect} from "react-hook-signal";
import {FormContext, FormContextType} from "./Form.tsx";
import {useLogger} from "../../core/utils/logger.ts";
import {isPromise} from "../../core/utils/isPromise.ts";
import {isEmpty} from "../../core/utils/isEmpty.ts";
import {Signal} from "signal-polyfill";


export function useFormInput<T, V>(props: {
    name?: string,
    value?: T,
    error?: string,
    disabled?: boolean,
    valueToLocalValue?: (val?: T) => (Promise<V | undefined> | V | undefined),
    onChange?: (value?: T) => void,
    preventChange?: (value?: T) => Promise<boolean>,
    valueIsEqual?: (prev?: T, next?: T) => boolean,
    validator?: (value?: T) => Promise<string | unknown>,
    required?: boolean,
    label?: string,
    elementId?: string
}): {
    localValue?: V,
    setLocalValue: Dispatch<SetStateAction<V>>,
    localError?: string,
    setLocalError: Dispatch<SetStateAction<string | undefined>>,
    nameSignal: Signal.State<string | undefined>,
    isDisabled?: boolean,
    setIsDisabled: Dispatch<SetStateAction<boolean>>,
    isBusy?: boolean,
    setIsBusy: Dispatch<SetStateAction<boolean>>,
    formContext?: FormContextType,
    handleValueChange: (param: SetStateAction<T>) => Promise<void>
} {
    const {
        name,
        value,
        error,
        disabled: disabledProps,
        valueToLocalValue,
        valueIsEqual,
        preventChange,
        validator: propsValidator,
        required,
        label,
        elementId
    } = props;
    const log = useLogger(`useFormInput:${label}`);
    log.setLevel('warn');
    const nameSignal = useSignal(name);
    const disabledPropsSignal = useSignal(disabledProps);
    const validator = useCallback(async (value?: T) => {
        log.debug('value', value, 'required', required, 'propsValidator', propsValidator);
        if (required && isEmpty(value)) {
            return 'Value is required';
        }
        if (propsValidator) {
            return await propsValidator(value)
        }
        return undefined;
    }, [propsValidator, required, log]);

    const [localValue, _setLocalValue] = useState<V | undefined>(() => {
        if (valueToLocalValue) {
            const val = valueToLocalValue(value);
            if (val instanceof Promise) {
                return undefined;
            } else {
                return val;
            }
        }
        return value as V;
    });

    const [localError, setLocalError] = useState<string | undefined>(error);
    const [isDisabled, setIsDisabled] = useState<boolean | undefined>(() => {
        if (disabledProps !== undefined) {
            return disabledProps;
        }
        return undefined;
    });
    const [isBusy, setIsBusy] = useState<boolean>(false);
    const formContext = useContext(FormContext);
    const propsRef = useRef({...props, localValue, valueIsEqual, preventChange});
    propsRef.current = {...props, localValue, valueIsEqual, preventChange};

    useEffect(() => {
        if (formContext && elementId && name) {
            const validators = [...formContext.validators.get()];
            validators.push({elementId, name, validator});
            formContext.validators.set(validators);
        }
        return () => {
            if (formContext && elementId && name) {
                const validators = formContext.validators.get();
                const validates = validators.filter(i => i.elementId !== elementId);
                formContext.validators.set(validates);
            }
        }
    }, [name, validator, formContext, elementId]);

    const setLocalValue = useCallback(function setLocalValue(next: V) {
        _setLocalValue(prev => {
            let nxt: V = next;
            if (typeof next === "function") {
                nxt = next(prev);
            }
            if (propsRef.current.valueIsEqual && propsRef.current.valueIsEqual(prev, nxt)) {
                return prev;
            }
            return nxt;
        })
    }, []) as Dispatch<SetStateAction<V>>

    useEffect(() => {
        nameSignal.set(name);
    }, [nameSignal, name]);

    useEffect(() => {
        const {valueToLocalValue} = propsRef.current;
        if (valueToLocalValue) {
            const val = valueToLocalValue(value);
            if (val instanceof Promise) {
                val.then(setLocalValue)
            } else {
                setLocalValue(val);
            }
        } else {
            setLocalValue(value as V);
        }
    }, [value, setLocalValue]);

    useEffect(() => {
        setLocalError(error);
    }, [error]);

    useEffect(() => disabledPropsSignal.set(disabledProps), [disabledProps, disabledPropsSignal]);

    useSignalEffect(() => {
        const formValue = formContext?.value.get();
        const name = nameSignal.get();
        if (name && formValue && name in formValue) {
            const value = formValue[name] as T;
            const {valueToLocalValue} = propsRef.current;
            if (valueToLocalValue) {
                const val = valueToLocalValue(value);
                if (val instanceof Promise) {
                    val.then(setLocalValue)
                } else {
                    setLocalValue(val);
                }
            } else {
                setLocalValue(value as unknown as V);
            }
        }
    });

    useSignalEffect(() => {
        const formError = formContext?.errors.get();
        const name = nameSignal.get();
        if (name && formError) {
            setLocalError(formError[name]);
        }
    });

    useSignalEffect(() => {
        const isBusy = formContext !== undefined && formContext.isBusy.get();
        const isFormDisabled = formContext !== undefined && formContext.isDisabled.get();
        const hasDisabledFlagSet = disabledPropsSignal.get() !== undefined;
        setIsBusy(isBusy);
        if (hasDisabledFlagSet) {
            setIsDisabled(disabledPropsSignal.get() === true);
        } else {
            setIsDisabled(isFormDisabled);
        }
    });

    const handleValueChange = useCallback(async (nxtVal?: (T | ((current?: T) => T | undefined))) => {
        let nextValue = nxtVal as (T | undefined);
        let prevValue = propsRef.current.value;

        if (name && formContext) {
            prevValue = formContext.value.get()[name] as T;
        }

        if (typeof nxtVal === 'function') {
            const newValueFunction = nxtVal as (param?: T) => T;
            nextValue = newValueFunction(prevValue);
        }

        const isMatch = JSON.stringify(nextValue) === JSON.stringify(prevValue);

        if (isMatch) {
            return
        }

        // now we check if there is preventive change involved
        if (propsRef.current.preventChange) {
            const response = propsRef.current.preventChange(nextValue);
            if (response === true) {
                return;
            }
            if (isPromise(response)) {
                const val = await response;
                if (val === true) {
                    return;
                }
            }
        }

        if (name && formContext) {
            const errors = {...formContext.errors.get()};
            delete errors[name];
            formContext.errors.set(errors);

            const newFormVal = {...formContext.value.get(), [name]: nextValue};
            formContext.value.set(newFormVal);
            if (propsRef.current.onChange) {
                propsRef.current.onChange(nextValue);
            }
            return;
        }

        if (propsRef.current.onChange) {
            propsRef.current.onChange(nextValue);
            return;
        }

        // we do this because we want to directly update localValue
        if (propsRef.current.valueToLocalValue) {
            const valueToLocalValue = propsRef.current.valueToLocalValue;
            const val = valueToLocalValue(nextValue);
            if (isPromise(val)) {
                nextValue = await val;
            } else {
                nextValue = val;
            }
        }
        setLocalValue(nextValue)

    }, [name, formContext, setLocalValue]);
    const [, startTransition] = useTransition();
    const handleValueChangeTransition = useCallback(async (nxtVal?: (T | ((current?: T) => T | undefined))) => {
        startTransition(() => {
            handleValueChange(nxtVal)
        })
    }, [handleValueChange]);
    return {
        localValue,
        setLocalValue,
        localError,
        setLocalError,
        nameSignal,
        isDisabled,
        setIsDisabled,
        isBusy,
        setIsBusy,
        formContext,
        handleValueChange: handleValueChangeTransition
    };
}


import {createContext, CSSProperties, ForwardedRef, forwardRef, LegacyRef, useCallback, useEffect, useRef} from "react";
import {useComputed, useSignal, useSignalEffect} from "react-hook-signal";
import {Signal} from "signal-polyfill";
import {Container} from "../designer/AppDesigner.tsx";
import {useContainerStyleHook} from "./container/useContainerStyleHook.ts";
import {useContainerLayoutHook} from "./container/useContainerLayoutHook.tsx";
import {ContainerRendererIdContext} from "../designer/panels/design/ContainerRenderer.tsx";
import {guid} from "../../core/utils/guid.ts";
import {isEmpty} from "../../core/utils/isEmpty.ts";

type Validator = (params: unknown) => Promise<string | undefined>;
const focusedElementId = new Signal.State<string | undefined>(undefined);
export const Form = forwardRef(function Form(props: {
    value?: Record<string, unknown>,
    onChange?: (value: Record<string, unknown>, config: {
        errors: Signal.State<Record<string, string>>,
        reset: () => void,
        initialValue?: Record<string, unknown>,
        value: Signal.State<Record<string, unknown>>,
    }) => (Promise<void> | void),
    container: Container,
    decorator?: (newValue?: Record<string, unknown>, prevValue?: Record<string, unknown>) => Promise<Record<string, unknown>>,
    style: CSSProperties,
    disabled?: boolean,
    dataElementId: string
}, ref: ForwardedRef<HTMLFormElement>) {

    const {value, onChange, container, disabled, style, decorator} = props;
    const containerStyle = useContainerStyleHook(style);
    const {elements} = useContainerLayoutHook(container);

    const propsRef = useRef({onChange, decorator});
    propsRef.current = {onChange, decorator};
    const prevValueRef = useRef<Record<string, unknown> | undefined>(undefined);
    const localValue = useSignal<Record<string, unknown>>(structuredClone(value ?? {}));

    const errors = useSignal<Record<string, string>>({});
    const validators = useSignal<Array<{
        name: string,
        elementId: string,
        validator: Validator,
        disabled?: boolean
    }>>([]);

    const touched = useSignal<Record<string, number>>({})
    const isBusy = useSignal<boolean>(false);
    const isDisabled = useSignal<boolean>(disabled === true);
    const isChanged = useComputed<boolean>(() => {
        const touch = touched.get();
        const keys = Object.keys(touch);
        if (keys.length === 0) {
            return false;
        }
        return keys.reduce((isTouched, key) => (isTouched || touch[key] > 0), false)
    });

    const reset = () => {
        localValue.set(structuredClone(value ?? {}));
        touched.set({});
        errors.set({});
    }

    const submit = async () => {
        isBusy.set(true);
        const isValid = await formIsValid();
        if (!isValid) {
            isBusy.set(false);
            return;
        }
        if (!propsRef.current.onChange) {
            isBusy.set(false);
            return;
        }
        await propsRef.current.onChange(localValue.get(), {value: localValue, initialValue: value, errors, reset});
        touched.set({});
        isBusy.set(false);
    }
    const validateValue = async (props: { key: string, value: unknown }) => {
        const validatorsValue = validators.get();
        if (validatorsValue) {
            const validatorObjects = validatorsValue.filter(v => v.name === props.key);
            for (const validatorObject of validatorObjects) {
                const error = await validatorObject.validator(props.value);
                if (!isEmpty(error)) {
                    return error;
                }
            }
        }
        return undefined;
    }

    const formIsValid = async () => {
        debugger;
        const formValue = localValue.get();
        const validatorKeys = validators.get().map(i => i.name);
        const errorsValue: Record<string, string> = {};
        for (const key of validatorKeys) {
            const value = formValue[key];
            const error = await validateValue({key, value});
            if (error) {
                errorsValue[key] = error as string
            }
        }
        errors.set(errorsValue);
        return Object.keys(errorsValue).length === 0;
    }

    const focusNext = (forward?: boolean) => {
        const currentFocusedElementId = focusedElementId.get();
        const elements = validators.get();
        const index = elements.findIndex(i => i.elementId === currentFocusedElementId);
        const nextIndex = forward === false ? index - 1 : index + 1;
        const nextElementToBeFocused = nextIndex >= 0 && elements.length > nextIndex ? elements[nextIndex] : undefined;
        focusedElementId.set(nextElementToBeFocused?.elementId)
    }

    useEffect(() => {
        isDisabled.set(disabled === true);
    }, [disabled, isDisabled]);

    useEffect(() => {
        localValue.set(structuredClone(value ?? {}));
        touched.set({});
    }, [localValue, isChanged, value]);

    useSignalEffect(() => {
        const valPrev = prevValueRef.current;
        const valCurrent = localValue.get();
        (async () => {
            if (propsRef.current.decorator) {
                const valNext = await propsRef.current.decorator(valCurrent, valPrev);
                prevValueRef.current = valNext;
                if (valNext !== valCurrent) {
                    localValue.set(valNext);
                }
            }
        })();
    })
    const fieldChangeListenerRef = useRef<Array<{
        key: string,
        callback: (props: { isChanged: boolean, lastChanged?: Date }) => void
    }>>([]);

    const onFieldChange = useCallback(function onFieldChange(key: string, callback: (props: {
        isChanged: boolean,
        lastChanged?: Date
    }) => void) {
        const listener = {callback, key};
        fieldChangeListenerRef.current.push(listener);
        return function removeListener() {
            fieldChangeListenerRef.current.splice(fieldChangeListenerRef.current.indexOf(listener), 1);
        }
    }, []);

    const touch = useCallback(function touch(key: string) {
        touched.set({...touched.get(), [key]: Date.now()})
    }, [])

    const touchPrevValue = useRef<Record<string, number>>({});
    useSignalEffect(() => {
        const touch = touched.get();
        const touchPrevVal = touchPrevValue.current;
        touchPrevValue.current = touch;
        const diff = getObjectDiff(touchPrevVal, touch);
        Object.keys(diff).forEach(key => {
            fieldChangeListenerRef.current.forEach(k => {
                if (k.key === key) {
                    let isChanged = false;
                    let date:Date|undefined = undefined;
                    if(diff && key in diff && diff[key] && diff[key].next){
                        isChanged = diff[key].next > 0
                        if(isChanged){
                            date = new Date(diff[key].next);
                        }
                    }
                    k.callback({isChanged, lastChanged: date})
                }
            })
        });

    })

    return <ContainerRendererIdContext.Provider value={props.dataElementId}>
        <form ref={ref as LegacyRef<HTMLFormElement>}
              style={containerStyle}
              data-element-id={props.dataElementId}
              onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  submit().then()
              }}
              onKeyDown={(e) => {
                  if (e.code.toUpperCase() === 'ENTER') {
                      submit().then()
                  }
              }}
              autoComplete={guid()}>
            <FormContext.Provider value={{
                value: localValue,
                initialValue: value ?? {},
                touched,
                errors,
                validators,
                submit,
                reset,
                isChanged,
                onChange: onFieldChange,
                formIsValid,
                validateValue,
                isBusy,
                isDisabled,
                focusedElementId,
                focusNext,
                touch
            }}>
                {elements}
            </FormContext.Provider>
        </form>
    </ContainerRendererIdContext.Provider>
});
export type FormContextType = {
    value: Signal.State<Record<string, unknown>>,
    initialValue: Record<string, unknown>,
    errors: Signal.State<Record<string, string>>,
    isChanged: Signal.Computed<boolean>,
    touched: Signal.State<Record<string, number>>,
    validators: Signal.State<Array<{
        name: string,
        elementId: string,
        validator: Validator,
        disabled?: boolean
    }>>,
    focusedElementId: Signal.State<string | undefined>,
    reset: () => void,
    submit: () => Promise<void>,
    formIsValid: () => Promise<boolean>
    validateValue: (params: { key: string, value: unknown }) => Promise<string | undefined> | undefined,
    isBusy: Signal.State<boolean>,
    isDisabled: Signal.State<boolean>,
    focusNext: (forward?: boolean) => void,
    onChange: (key: string, callback: (props: { isChanged: boolean, lastChanged?: Date }) => void) => () => void,
    touch: (key: string) => void
}

function getObjectDiff(prev: Record<string, number>, next: Record<string, number>): Record<string, {
    prev?: number,
    next?: number
}> {
    let diff:Record<string, {prev?:number,next?:number}> = {};
    let keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    keys.forEach(key => {
        if (prev[key] !== next[key]) {
            diff[key] = {prev: prev[key], next: next[key]};
        }
    })
    return diff;
}

export const FormContext = createContext<FormContextType | undefined>(undefined)

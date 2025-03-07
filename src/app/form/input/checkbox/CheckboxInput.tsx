import {CSSProperties, ForwardedRef, forwardRef} from "react";
import {useFormInput} from "../../useFormInput.ts";
import {FaCheck} from "react-icons/fa";
import {BORDER} from "../../../../core/style/Border.ts";

export const CheckboxInput = forwardRef(function CheckboxInput(props: {
    name?: string,
    value?: boolean,
    label?: string,
    onChange?: (params?: boolean) => void,
    style: CSSProperties,
    error?: string,
    disabled?: boolean,
    required?: boolean,
    validator?: (value?: unknown) => Promise<string | undefined>,
}, ref: ForwardedRef<HTMLLabelElement>) {
    const {name, value, onChange, error, label, style, required, validator, disabled} = props;
    const {localValue, localError, handleValueChange, isDisabled, isBusy} = useFormInput<typeof value, typeof value>({
        name,
        value,
        error,
        onChange,
        disabled,
        required,
        validator,
        label
    });
    const inputDisabled = isDisabled || isBusy;
    const checkboxStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: localError ? 'red' : '#333',
        border: BORDER,
        width: 15, height: 15,
        borderRadius: 3
    } as CSSProperties;

    if (inputDisabled) {
        style.background = 'rgba(0,0,0,0.05)';
    }
    return <label ref={ref} style={{display: 'flex', flexDirection: 'column', ...style}}
                  onClick={async () => {
                      if (inputDisabled) {
                          return;
                      }
                      await handleValueChange(!localValue);
                  }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
            <div style={checkboxStyle} tabIndex={0}
                 onKeyDown={async (key) => {
                     if (inputDisabled) {
                         return;
                     }
                     if (key.code.toUpperCase() === 'ENTER') {
                         await handleValueChange(!localValue);
                     }
                 }}>
                {localValue &&
                    <FaCheck style={{color: 'rgba(0,0,0,0.8)'}}/>}
            </div>
            {label && <div style={{paddingBottom: 2}}>
                {label}
            </div>}
        </div>
        {localError && <div style={{textAlign: 'right', color: 'red'}}>
            {localError}
        </div>}
    </label>
})
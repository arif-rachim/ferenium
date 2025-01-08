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
}, ref: ForwardedRef<HTMLLabelElement>) {
    const {name, value, onChange, error, label, style} = props;
    const {localValue, localError, handleValueChange, isDisabled, isBusy} = useFormInput<typeof value, typeof value>({
        name,
        value,
        error,
        onChange
    });
    const inputDisabled = isDisabled || isBusy;
    return <label ref={ref} style={{display: 'flex', flexDirection: 'column', ...style}}
                  onClick={() => {
                      handleValueChange(!localValue);
                  }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: localError ? 'red' : '#333',
                border : BORDER,
                background : inputDisabled ? 'rgba(0,0,0,0.05)' :'unset',
                width:15,height:15,
                borderRadius:3
            }} tabIndex={0}
                 onKeyDown={(key) => {
                     if (key.code.toUpperCase() === 'ENTER') {
                         handleValueChange(!localValue);
                     }
                 }}>
                {localValue &&
                    <FaCheck style={{ color: 'rgba(0,0,0,0.8)'}}/>}
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
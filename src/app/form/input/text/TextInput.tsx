import {BORDER, BORDER_ERROR} from "../../../../core/style/Border.ts";
import type {ChangeEvent, ReactNode} from "react";
import {
    createElement,
    CSSProperties,
    ForwardedRef,
    forwardRef,
    MutableRefObject,
    useEffect,
    useRef,
    useState
} from "react";
import {Label} from "../../Label.tsx";
import {guid} from "../../../../core/utils/guid.ts";
import {useFormInput} from "../../useFormInput.ts";

export const TextInput = forwardRef(function TextInput(props: {
        name?: string,
        value?: string,
        onChange?: (value?: string) => void,
        onFocus?: () => void,
        onBlur?: (value: string) => void,
        onKeyDown?: (value: string) => void,
        onKeyUp?: (value: string) => void,
        onMouseDown?: () => void,
        label?: string,
        error?: string,
        style?: CSSProperties,
        inputStyle?: CSSProperties,
        maxLength?: number,
        disabled?: boolean,
        type?: 'text' | 'number' | 'password' | 'textarea',
        allCaps?: boolean,
        inputRef?: MutableRefObject<HTMLInputElement | undefined>,
        overlayElement?: ReactNode
    }, ref: ForwardedRef<HTMLLabelElement>) {
        const {
            value,
            onChange,
            style: defaultStyle,
            label,
            inputStyle,
            error,
            onFocus,
            onBlur,
            onKeyDown,
            onKeyUp,
            onMouseDown,
            maxLength,
            name,
            type,
            allCaps,
            disabled,
            overlayElement
        } = props;

        const {
            localValue,
            localError,
            isDisabled,
            isBusy,
            handleValueChange
        } = useFormInput<typeof value, typeof value>({
            name,
            value,
            error,
            disabled,
            onChange
        });

        const [cursorLoc, setCursorLoc] = useState<null | number>(null);

        const localRef = useRef<HTMLInputElement | null>(null);
        const inputRef = props.inputRef ? props.inputRef : localRef;

        const inputDisabled = isDisabled || isBusy;
        const propsRef = useRef({onChange});
        propsRef.current = {onChange};

        useEffect(() => {
            if (inputRef.current && inputRef.current?.type !== 'number') {
                inputRef.current.setSelectionRange(cursorLoc, cursorLoc);
            }
        }, [inputRef, localValue, cursorLoc]);


        const style = {
            border: localError ? BORDER_ERROR : BORDER,
            padding: '2px 5px 3px 5px',
            borderRadius: 5,
            background: inputDisabled ? 'rgba(0,0,0,0.05)' : 'unset',
            flexGrow: 1,
            minWidth: 0,
            textAlign: type === 'number' ? 'right' : 'left',
            ...inputStyle,
        } as CSSProperties
        const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
            if (inputDisabled) {
                return;
            }

            let val = getValue(e) ?? '';
            if (allCaps !== false && type !== 'password') {
                val = val.toUpperCase();
            }
            setCursorLoc(e.target.selectionStart);
            handleValueChange(val);
        };
        const handleFocus = () => {
            if (onFocus) {
                onFocus()
            } else {
                inputRef.current?.select()
            }
        };
        const handleBlur = (e:ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (onBlur) {
                onBlur(val);
            }
        }
        const handleKeyDown = (e:ChangeEvent<HTMLInputElement>) => {
            const val = getValue(e) ?? '';
            if (onKeyDown) {
                onKeyDown(val)
            }
        }
        const handleKeyUp = (e:ChangeEvent<HTMLInputElement>) => {
            const val = getValue(e) ?? '';
            if (onKeyUp) {
                onKeyUp(val)
            }
        }
        const handleMouseDown = () => {
            if (onMouseDown) {
                onMouseDown()
            }
        }

        const input = createElement(type === 'textarea' ? 'textarea' : 'input',{
            ref : inputRef as MutableRefObject<HTMLInputElement>,
            name : name,
            disabled : inputDisabled,
            value : overlayElement ? '' : localValue ?? '',
            maxLength,
            type,
            onChange : handleChange,
            onFocus : handleFocus,
            onBlur : handleBlur,
            onKeyDown : handleKeyDown,
            onKeyUp : handleKeyUp,
            onMouseDown : handleMouseDown,
            style : style,
            autoComplete : guid()
        })
        return <Label label={label} ref={ref} style={{minWidth: 0, ...defaultStyle}}>
            {input}
            {overlayElement &&
                <div style={{
                    position: 'absolute',
                    bottom: 5,
                    width: '100%',
                    display: 'flex',
                    flexDirection:'column'
                }}>{overlayElement}</div>
            }

            {localError && <div style={{
                padding: '0 5px',
                fontSize: 'small',
                lineHeight: 1,
                color: '#C00000',
                textAlign: 'right'
            }}>{localError}</div>}
        </Label>
    }
);

function getValue(e: unknown): string | undefined {
    if (e && typeof e === 'object' && 'target' in e && e.target && typeof e.target === 'object' && 'value' in e.target) {
        return e.target.value as string;
    }
    return undefined;
}
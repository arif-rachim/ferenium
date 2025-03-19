import {CSSProperties, ForwardedRef, forwardRef, PropsWithChildren, useEffect, useId} from "react";
import {useFormInput} from "../../useFormInput.ts";

export const ValidationInput = forwardRef(function ValidationPrompt(props: PropsWithChildren<{
        name?: string,
        style?: CSSProperties,
        validator?: () => Promise<string | undefined>,
    }>, ref: ForwardedRef<HTMLLabelElement>) {
        const {style, validator, name} = props;
        const id = useId();
        const validationName = name ?? id;
        const {
            localError,
            formContext
        } = useFormInput<unknown, unknown>({
            name: validationName,
            validator,
        });
        useEffect(() => {
            if (formContext) {
                return formContext.onChange(validationName, (props) => {
                    if(props.isChanged){

                        const errors = {...formContext.errors.get()};
                        delete errors[validationName];
                        formContext.errors.set(errors);
                    }
                })
            }
        }, [formContext?.onChange, validationName]);

        return <label ref={ref} style={{
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#FF2D2D',
            color: 'white',
            padding: '2px 5px 3px 5px',
            borderLeft: '5px solid #D00000',
            ...style,
            display: localError ? 'flex' : 'none',
        }} dangerouslySetInnerHTML={{__html:localError ? localError : ''}}>
        </label>
    }
);
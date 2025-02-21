import type {MouseEvent} from "react";
import {CSSProperties, ForwardedRef, forwardRef, PropsWithChildren} from "react";

export const Label = forwardRef(function LabelContainer(props: PropsWithChildren<{
        label?: string,
        style?: CSSProperties,
        styleLabel?: CSSProperties,
        errorMessage?: string,
        onMouseEnter?: (event: MouseEvent) => void,
        onMouseLeave?: (event: MouseEvent) => void
    }>, ref: ForwardedRef<HTMLLabelElement>) {
        const {style, label, styleLabel, errorMessage, onMouseEnter, onMouseLeave} = props;

        return <label ref={ref} style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            ...style
        }} title={errorMessage} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {label && <div style={{
                padding: '0 5px',
                fontSize: 'small',
                lineHeight: 1.2,
                color: errorMessage ? '#C00000' : 'unset', ...styleLabel
            }}>{label}
            </div>}
            {props.children}
        </label>
    }
);
import type {MouseEvent} from "react";
import {CSSProperties, ForwardedRef, forwardRef, PropsWithChildren} from "react";
import {motion} from "framer-motion";

export const Label = forwardRef(function LabelContainer(props: PropsWithChildren<{
        label?: string,
        style?: CSSProperties,
        styleLabel?: CSSProperties,
        errorMessage?: string,
        onMouseEnter?: (event: MouseEvent) => void,
        onMouseLeave?: (event: MouseEvent) => void,
        isBusy?: boolean
    }>, ref: ForwardedRef<HTMLLabelElement>) {
        const {style, label, styleLabel, errorMessage, onMouseEnter, onMouseLeave, isBusy} = props;

        return <label ref={ref} style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
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
            {isBusy === true &&
                <motion.div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 28,
                    width: '30%',
                    background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.1), transparent)',
                    opacity: 0.7
                }} animate={{x: ["-200%", "400%"]}}
                            transition={{duration: 1.5, repeat: Infinity, ease: 'linear'}}
                ></motion.div>
            }
        </label>
    }
);
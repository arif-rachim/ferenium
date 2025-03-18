import {useShowModal} from "./modal/useShowModal.ts";
import {CSSProperties, ForwardedRef, ReactElement} from "react";
import {guid} from "../utils/guid.ts";

export function useShowPopUp() {
    const showModal = useShowModal();
    return function showPopUp<T, V extends HTMLElement = HTMLElement>(ref: ForwardedRef<V>, panel: (closePanel: (param?: T) => void, commitLayout: () => void) => ReactElement) {

        return showModal<T>((closePanel) => {
            const id = guid();
            let width: CSSProperties['width'] = 0;
            let top: CSSProperties['top'] = 0;
            let left: CSSProperties['left'] = 0;
            let height: CSSProperties['height'] = 0;
            let isMounted = false;
            if (ref && 'current' in ref && ref.current) {
                const rect = ref.current.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                top = rect.bottom;
                left = rect.left;
            }
            const element = panel(closePanel, async () => {
                await delay(0);
                const div = document.getElementById(id);
                if (div === null) {
                    return;
                }
                const {left, top, isTop, isRight} = ensureVisibleInViewPort(div);
                div.style.left = `${left < 0 ? 0 : left}px`;
                div.style.top = `${top < 0 ? 0 : top}px`;
                div.style.opacity = '1';
                div.style.overflow = 'hidden';
                div.style.border = '1px solid rgba(0,0,0,0.1)'
                if (!isMounted) {
                    div.style.boxShadow = `0px ${isTop ? '-10px' : '10px'} 8px -8px rgba(0,0,0,0.5)`;
                    if (isTop) {
                        div.style.borderTopLeftRadius = '10px';
                        div.style.borderTopRightRadius = '10px';
                        if (isRight) {
                            div.style.borderBottomLeftRadius = '10px';
                        } else {
                            div.style.borderBottomRightRadius = '10px';
                        }
                    } else {
                        div.style.borderBottomLeftRadius = '10px';
                        div.style.borderBottomRightRadius = '10px';
                        if (isRight) {
                            div.style.borderTopLeftRadius = '10px';
                        } else {
                            div.style.borderTopRightRadius = '10px';
                        }
                    }
                    isMounted = true;
                }
            });

            return <div style={{width: '100%', height: '100%'}}>
                <div id={id} style={{minWidth: width, left, top, opacity: 0, position: 'fixed'}} data-ref-width={width}
                     data-ref-height={height}>{element}</div>
            </div>
        }, {plainPanel: true})
    }
}

function delay(timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}


function ensureVisibleInViewPort(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const refWidth = parseInt(element.getAttribute('data-ref-width') ?? '0')
    const refHeight = parseInt(element.getAttribute('data-ref-height') ?? '0')
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let newLeft = rect.left;
    let newTop = rect.top;
    let isTop = false;
    let isRight = false;
    if (rect.left < 0) {
        newLeft = 0;
    } else if (rect.right > viewportWidth) {
        newLeft = rect.left - rect.width + refWidth;
        isRight = true;
    }
    if (rect.top < 0) {
        newTop = 0;
    } else if (rect.bottom > viewportHeight) {
        newTop = rect.top - rect.height - refHeight - 2;
        isTop = true;
    }
    return {left: newLeft, top: newTop, isRight, isTop};
}

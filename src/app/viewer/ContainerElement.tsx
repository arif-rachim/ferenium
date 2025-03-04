import {Container} from "../designer/AppDesigner.tsx";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {AppViewerContext} from "./context/AppViewerContext.ts";
import {CSSProperties, useEffect, useMemo, useState} from "react";
import {useSignal, useSignalEffect} from "react-hook-signal";
import {ElementStyleProps} from "../designer/LayoutBuilderProps.ts";
import {ElementRenderer} from "./ElementRenderer.tsx";
import {EmptyComponent} from "../designer/components/empty-component/EmptyComponent.tsx";
import {isEmpty} from "../../core/utils/isEmpty.ts";

/**
 * The ContainerElement component renders a container element based on the provided props.
 */
export function ContainerElement(props: { container: Container }) {
    const {elements} = useAppContext<AppViewerContext>();
    const {container} = props;

    const containerSignal = useSignal(container);
    const initiateStyle = () => {
        const container: Container | undefined = containerSignal.get();

        const isRoot = isEmpty(container?.parent);
        const styleFromSignal = {display: 'flex',  ...container?.properties?.defaultStyle}

        if (isRoot) {
            if(!isEmpty(container?.properties?.style?.formula)){
                const formula = container?.properties?.style?.formula ?? '';
                const module = {exports:undefined};
                (new Function('module',formula)).call(null,module);
            }
            styleFromSignal['width'] = styleFromSignal['width'] ?? '100%';
            styleFromSignal['height'] = styleFromSignal['height'] ?? '100%';
        }
        styleFromSignal['flexDirection'] = styleFromSignal['flexDirection'] ?? 'column';

        return styleFromSignal as CSSProperties
    }
    const [computedStyle, setComputedStyle] = useState<CSSProperties>(initiateStyle)
    useEffect(() => {
        if(container !== containerSignal.get()){
            containerSignal.set(container);
        }
    }, [containerSignal, container]);
    useSignalEffect(() => setComputedStyle(initiateStyle()));
    const computedStyleString = JSON.stringify(computedStyle);
    const memoizedComputedStyle = useMemo(() => {
        return JSON.parse(computedStyleString);
    },[computedStyleString]) as CSSProperties;

    const elementProps: ElementStyleProps = {
        style: memoizedComputedStyle,
        dataElementId: container?.id ?? '',
        container: container
    };

    if (container && elements && elements[container?.type]) {
        return <ElementRenderer container={container} elementProps={elementProps}/>
    }
    return <EmptyComponent />
}

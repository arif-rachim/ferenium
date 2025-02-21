import {Container} from "../designer/AppDesigner.tsx";
import {ElementStyleProps} from "../designer/LayoutBuilderProps.ts";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {AppViewerContext} from "./context/AppViewerContext.ts";
import {EmptyComponent} from "../designer/components/empty-component/EmptyComponent.tsx";
import {CSSProperties, forwardRef, useEffect, useMemo, useRef} from "react";
import ErrorBoundary from "../../core/components/ErrorBoundary.tsx";
import {usePropertyInitialization} from "../designer/panels/design/usePropertyInitialization.tsx";

/**
 * Renders an element inside a container with specified props.
 */
export function ElementRenderer(props: { container: Container, elementProps: ElementStyleProps }) {
    const {container, elementProps} = props;
    const context = useAppContext<AppViewerContext>();
    const {component} = context && context.elements && container.type in context.elements ? context.elements[container.type] : {component: EmptyComponent};
    const ref = useRef<HTMLElement | null>(null);

    const propsRef = useRef(elementProps);
    propsRef.current = elementProps;

    const Component = useMemo(() => forwardRef(component), [component])

    // const [componentProps, setComponentProps] = useState<Record<string, unknown>>({})
    const componentProps = usePropertyInitialization({container:props.container})
    useEffect(() => {
        const element = ref.current;
        if (element) {
            element.setAttribute('data-element-id', propsRef.current["data-element-id"]);
        }
    }, [Component]);
    const {style, ...componentProperties} = componentProps as {style:CSSProperties};
    const defaultStyle = (style ?? {}) as CSSProperties;
    return <ErrorBoundary container={container}>
            <Component ref={ref} key={container?.id} container={container}
                       {...componentProperties}
                       style={{...elementProps.style, ...defaultStyle}}/>
        </ErrorBoundary>
}

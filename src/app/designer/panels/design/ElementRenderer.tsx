import {Container} from "../../AppDesigner.tsx";
import {CSSProperties, forwardRef, useEffect, useMemo, useRef} from "react";
import {CancellableEvent, ElementProps} from "../../LayoutBuilderProps.ts";
import {useAppContext} from "../../../../core/hooks/useAppContext.ts";
import {EmptyComponent} from "../../components/empty-component/EmptyComponent.tsx";
import ErrorBoundary from "../../../../core/components/ErrorBoundary.tsx";
import {usePropertyInitialization} from "./usePropertyInitialization.tsx";

/**
 * Renders a container component with dynamically generated properties based on container properties and dependencies.
 * This is considered as the glue attaching external component and the platform.
 *
 * In summary, RenderContainer performs the following tasks:
 * - It makes use of the React Context, AppDesignerContext, to get various properties and signals (which presumably represent state values managed with some sort of state management library).
 * - It derives the component based on container type. After destructuring container and elementsLib from the passed props and context respectively, Component is derived from elementsLib[container.type].
 * - It manages a propertiesSignal state, initialized from useSignal with container.properties and subsequently updated any time container.properties changes.
 * - It initializes an empty object in a state variable componentProps.
 * - It computes values for the component's props by creating a new object, componentPropertiesValue, and populates it based on propertiesSignal.get() and allPageVariablesSignalInstance.get(). If a property does not represent a Zod function, an effect is defined using the effect function.
 * - Function fun gets compiled at runtime with the new Function statement, making use of the various dependencies present in some state variables. This function is then called with the newly created module object and the instances of the dependencies as parameters.
 * - The module.exports value so obtained is set to be one of the properties of the componentPropertiesValue object. This componentPropertiesValue object is eventually assigned to the componentProps state variable.
 * - The return function of the useSignalEffect call cleans up any effects that may have been created inside the function (notably, due to effect() calls), by running their respective destroyer callbacks.
 * - Lastly, it renders the appropriate Component based on the container type, using componentProps.
 *
 */
export function ElementRenderer(props: { container: Container, elementProps: ElementProps }) {
    const {container, elementProps} = props;
    const context = useAppContext();
    const {component} = context && context.elements && container && container.type in context.elements ? context.elements[container.type] : {component: EmptyComponent};
    const ref = useRef<HTMLElement | null>(null);

    const propsRef = useRef(elementProps);
    propsRef.current = elementProps;

    const Component = useMemo(() => {
        //@ts-ignore
        return forwardRef(component)
    }, [component])

    const componentProps = usePropertyInitialization({container})

    useEffect(() => {
        const onDragStart = (event: Event) => propsRef.current.onDragStart(event as DragEvent);
        const onDragOver = (event: Event) => propsRef.current.onDragOver(event as DragEvent);
        const onDrop = (event: Event) => propsRef.current.onDrop(event as DragEvent);
        const onDragEnd = (event: Event) => propsRef.current.onDragEnd(event as DragEvent);
        const onMouseOver = (event: Event) => propsRef.current.onMouseOver(event as CancellableEvent);
        const onClick = (event: Event) => propsRef.current.onClick(event as CancellableEvent);
        const element = ref.current;
        if (element) {
            try {
                element.addEventListener('dragstart', onDragStart);
                element.addEventListener('dragover', onDragOver);
                element.addEventListener('drop', onDrop);
                element.addEventListener('dragend', onDragEnd);
                element.addEventListener('mouseover', onMouseOver);
                element.addEventListener('click', onClick);
                element.setAttribute('data-element-id', propsRef.current.dataElementId);
                element.setAttribute('draggable', propsRef.current.draggable.toString());
            } catch (err) {
                console.error(err)
            }
        }
        return () => {
            if (element) {
                try {
                    element.removeEventListener('dragstart', onDragStart);
                    element.removeEventListener('dragover', onDragOver);
                    element.removeEventListener('drop', onDrop);
                    element.removeEventListener('dragend', onDragEnd);
                    element.removeEventListener('mouseover', onMouseOver);
                    element.removeEventListener('click', onClick);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }, [Component]);
    const {style, ...componentProperties} = componentProps as {style:CSSProperties};
    const defaultStyle = (style ?? {}) as CSSProperties;

    return <>
        <ErrorBoundary container={container}>
            <Component ref={ref} key={container?.id} container={container}
                       dataElementId={elementProps.dataElementId} {...componentProperties}
                       style={{...elementProps.style, ...defaultStyle}}/>
        </ErrorBoundary>
    </>
}

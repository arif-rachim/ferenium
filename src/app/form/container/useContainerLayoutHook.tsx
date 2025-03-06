import {Container} from "../../designer/AppDesigner.tsx";
import {useAppContext} from "../../../core/hooks/useAppContext.ts";
import {AppDesignerContext} from "../../designer/AppDesignerContext.ts";
import {useSignal, useSignalEffect} from "react-hook-signal";
import {ReactNode, useEffect, useMemo, useState} from "react";
import {DropZone} from "../../designer/panels/design/DropZone.tsx";
import {DraggableContainerElement} from "../../designer/panels/design/DraggableContainerElement.tsx";
import {ContainerElement} from "../../viewer/ContainerElement.tsx";
import {viewMode} from "./viewMode.ts";

export function useContainerLayoutHook(container: Container) {
    const {uiDisplayModeSignal, allContainersSignal} = useAppContext<AppDesignerContext>();
    const displayMode = uiDisplayModeSignal ?? viewMode;
    const containerSignal = useSignal(container);

    //const [elements, setElements] = useState<ReactNode[]>([]);
    const [children, setChildren] = useState<string[]>(() => {
        const container: Container | undefined = containerSignal.get();
        return container?.children ?? [];
    });
    const [mode, setMode] = useState(() => {
        return displayMode.get();
    })
    const elements = useMemo(() => {
        const result: Array<ReactNode> = [];
        if (mode === 'design') {
            result.push(<DropZone precedingSiblingId={''}
                                  key={`drop-zone-root-${container?.id}`}
                                  parentContainerId={container?.id ?? ''}/>)
        }
        for (let i = 0; i < children?.length; i++) {
            const childId = children[i];
            const childContainer = allContainersSignal.get().find(i => i.id === childId)!;
            if (mode === 'design') {
                result.push(<DraggableContainerElement container={childContainer} key={childId}/>)
                result.push(<DropZone precedingSiblingId={childId} key={`drop-zone-${i}-${container?.id}`}
                                      parentContainerId={container?.id ?? ''}/>);
            } else {
                result.push(<ContainerElement container={childContainer} key={childId}/>)
            }
        }
        return result;
    }, [mode, children]);
    useEffect(() => {
        containerSignal.set(container);
    }, [containerSignal, container]);

    useSignalEffect(() => {
        const mode = displayMode.get();
        setMode(mode);
    })
    useSignalEffect(() => {
        const container: Container | undefined = containerSignal.get();
        const children = container?.children ?? [];
        setChildren(old => {
            if (JSON.stringify(old) === JSON.stringify(children)) {
                return old
            }
            return children;
        })
    });
    return {elements, displayMode};
}
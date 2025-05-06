import {Container} from "../../designer/AppDesigner.tsx";
import {useAppContext} from "../../../core/hooks/useAppContext.ts";
import {AppDesignerContext} from "../../designer/AppDesignerContext.ts";
import {useSignalEffect} from "react-hook-signal";
import {ReactNode, useMemo, useState} from "react";
import {DropZone} from "../../designer/panels/design/DropZone.tsx";
import {DraggableContainerElement} from "../../designer/panels/design/DraggableContainerElement.tsx";
import {ContainerElement} from "../../viewer/ContainerElement.tsx";
import {viewMode} from "./viewMode.ts";

export function useContainerLayoutHook(container: Container) {
    const {uiDisplayModeSignal, allContainersSignal} = useAppContext<AppDesignerContext>();
    const displayMode = uiDisplayModeSignal ?? viewMode;

    const [mode, setMode] = useState(() => {
        return displayMode.get();
    })

    const [allContainers,setAllContainers] = useState<Container[]>(allContainersSignal.get());
    useSignalEffect(() => {
        const allContainers = allContainersSignal.get();
        setAllContainers(allContainers)
    })

    const elements = useMemo(() => {
        const result: Array<ReactNode> = [];
        if (mode === 'design') {
            result.push(<DropZone precedingSiblingId={''}
                                  key={`drop-zone-root-${container?.id}`}
                                  parentContainerId={container?.id ?? ''}/>)
        }
        const children = container?.children ?? [];
        for (let i = 0; i < children?.length; i++) {
            const childId = children[i];
            const childContainer = allContainers.find(i => i.id === childId)!;
            if (mode === 'design') {
                result.push(<DraggableContainerElement container={childContainer} key={childId}/>)
                result.push(<DropZone precedingSiblingId={childId} key={`drop-zone-${i}-${container?.id}`}
                                      parentContainerId={container?.id ?? ''}/>);
            } else {
                result.push(<ContainerElement container={childContainer} key={childId}/>)
            }
        }
        return result;
    }, [mode, allContainers,container]);

    useSignalEffect(() => {
        const mode = displayMode.get();
        setMode(mode);
    })

    return {elements, displayMode};
}
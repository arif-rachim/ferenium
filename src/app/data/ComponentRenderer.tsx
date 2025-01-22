import {CSSProperties, ForwardedRef, forwardRef, memo, useEffect, useState} from "react";
import {Page} from "../designer/AppDesigner.tsx";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {useSignal, useSignalEffect} from "react-hook-signal";
import {PageViewer} from "../viewer/PageViewer.tsx";

export const ComponentRenderer = memo(forwardRef(ComponentRendererFC));

function ComponentRendererFC(props: {
    component: string,
    style: CSSProperties
}, ref: unknown) {

    const {style: propsStyle, component, ...properties} = props;
    if(component === undefined){
        debugger;
    }
    const componentIdSignal = useSignal(component);
    const {allPagesSignal, elements, applicationSignal, navigate} = useAppContext();
    const [page, setPage] = useState<Page | undefined>(() => {
        const allPages = allPagesSignal.get();
        const componentId = componentIdSignal.get();
        const page = allPages.find(p => p.id === componentId);
        if(page === undefined){
            console.log('opps cannot find pages for ',componentId);
        }
        return page;
    });

    const style: CSSProperties = {
        display: 'flex',
        minHeight: 20,
        minWidth: 20,
        ...propsStyle
    }
    useEffect(() => {
        componentIdSignal.set(component)
    }, [component, componentIdSignal]);

    useSignalEffect(() => {
        const allPages = allPagesSignal.get();
        const componentId = componentIdSignal.get();
        const page = allPages.find(p => p.id === componentId);
        setPage(page);
    });
    const appConfig = applicationSignal.get();

    return <div ref={ref as ForwardedRef<HTMLDivElement>} style={style}>
        {page && <PageViewer
            elements={elements}
            page={page!}
            appConfig={appConfig}
            value={properties} navigate={navigate}/>}
    </div>
}
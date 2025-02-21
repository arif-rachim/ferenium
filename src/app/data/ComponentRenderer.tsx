import {CSSProperties, ForwardedRef, forwardRef, memo, useEffect, useMemo, useRef, useState} from "react";
import {Page} from "../designer/AppDesigner.tsx";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {useSignal, useSignalEffect} from "react-hook-signal";
import {PageViewer} from "../viewer/PageViewer.tsx";
import {createLogger} from "../../core/utils/logger.ts";
import {useWhichChange} from "../../core/hooks/useWhichChange.ts";

export const ComponentRenderer = memo(forwardRef(ComponentRendererFC));
const log = createLogger('ComponentRenderer');

function useCheckIfPropsIsChanged(next){
    const prevValueRef = useRef<Record<string, unknown>>();
    const nextValueRef = useRef(next);
    nextValueRef.current = next;
    const prev = prevValueRef.current;
    const nextKeys = Object.keys(next);

    let somethingIsChanged = prev === undefined;
    for (const key of nextKeys) {
        const prevVal = prev && prev[key];
        const nextVal = next[key];
        if(typeof nextVal === 'function'){
            continue
        }
        if(Array.isArray(prevVal) && Array.isArray(nextVal)) {
            if(nextVal.length === 0 && prevVal.length === 0){
                continue;
            }
        }
        if(prevVal !== nextVal){
            somethingIsChanged = true;
        }
    }
    if(!somethingIsChanged){
        return prev;
    }
    // okay we know now something is changed, other wise send back the old params.
    const nextA = {};
    for (const key of nextKeys) {
        if(typeof next[key] === 'function'){
            nextA[key] = (...args) => {
                const fun = nextValueRef.current[key] as (...args:unknown[]) => void;
                if(fun){
                    return fun(...args)
                }
                return undefined;
            }
        }else{
            nextA[key] = next[key];
        }
    }
    prevValueRef.current = nextA;
    return nextA;
}

function ComponentRendererFC(props: {
    component: string,
    style: CSSProperties
}, ref: unknown) {

    const {style: propsStyle, component, ...nextProperties} = props;
    //const properties = nextProperties;
    const properties = useCheckIfPropsIsChanged(nextProperties);
    const componentIdSignal = useSignal(component);
    const {allPagesSignal, elements, applicationSignal, navigate} = useAppContext();
    const [page, setPage] = useState<Page | undefined>(() => {
        const allPages = allPagesSignal.get();
        const componentId = componentIdSignal.get();
        const page = allPages.find(p => p.id === componentId);
        if(page === undefined){
            log.error('Ops cannot find pages for ',componentId);
        }
        return page;
    });
    const propsStyleString = JSON.stringify(propsStyle);
    const style: CSSProperties = useMemo(() => ({
        display: 'flex',
        minHeight: 20,
        minWidth: 20,
        ...(JSON.parse(propsStyleString))
    }),[propsStyleString])

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
    useWhichChange('ComponentRenderer',{ref, style, page, elements, appConfig, properties, navigate})
    return useMemo(() => (<div ref={ref as ForwardedRef<HTMLDivElement>} style={style}>
        {page && <PageViewer
            elements={elements}
            page={page!}
            appConfig={appConfig}
            value={properties ?? emptyObject} navigate={navigate}/>}
    </div>),[ref, style, page, elements, appConfig, properties, navigate])
}

const emptyObject = {};

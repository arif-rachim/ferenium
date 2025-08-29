import {LayoutBuilderProps} from "../../app/designer/LayoutBuilderProps.ts";
import {useComputed, useSignal, useSignalEffect} from "react-hook-signal";
import {createNewBlankApplication} from "../../app/designer/createNewBlankApplication.ts";
import {Query, TableContext} from "../../app/designer/panels/database/getTables.ts";
import {Signal} from "signal-polyfill";
import {ErrorType} from "../ErrorType.ts";
import {useContext, useEffect, useMemo, useRef} from "react";
import {
    Application,
    Callable,
    Container,
    Fetcher,
    Page,
    Variable,
    VariableInstance
} from "../../app/designer/AppDesigner.tsx";


export function useAppInitiator(props: LayoutBuilderProps & {
    startingPage?: string,
    displayMode?: 'design' | 'view'
}) {
    const applicationSignal = useSignal(props.value ? props.value : createNewBlankApplication());

    const allApplicationCallablesSignal = useComputed(() => applicationSignal.get().callables ?? []);
    const allPagesSignal = useComputed<Array<Page>>(() => applicationSignal.get().pages ?? []);
    const allTablesSignal = useContext(TableContext)!;
    const navigationStackRef = useRef< Array<{ path: string, param?: unknown }>>([]);
    const startingPage = props.startingPage;
    useEffect(() => {
        navigationStackRef.current = [];
        if(startingPage){
            navigationStackRef.current.push({path: startingPage, param: undefined});
        }
    }, [startingPage]);
    const allApplicationQueriesSignal = useComputed(() => applicationSignal.get().queries ?? []);
    useSignalEffect(() => {
        const allPages = allPagesSignal.get();
        if (props.startingPage) {
            const startingPageId = allPages.find(p => {
                return p.name === props.startingPage;
            })?.id ?? '';
            activePageIdSignal.set(startingPageId);
        }
    });

    const activePageId = useMemo(() => {
        const allPages = allPagesSignal.get() ?? [];
        const pageId = allPages.find(p => p.name === startingPage)?.id ?? '';
        return pageId;
    }, [allPagesSignal, startingPage])

    const activePageIdSignal = useSignal<string>(activePageId);
    const activeDropZoneIdSignal = useSignal('');
    const selectedDragContainerIdSignal = useSignal('');
    const hoveredDragContainerIdSignal = useSignal('');

    const uiDisplayModeSignal = useSignal<'design' | 'view'>(props.displayMode ?? 'view');
    const variableInitialValueSignal = useSignal<Record<string, unknown>>({});
    const allApplicationVariablesSignalInstance: Signal.State<VariableInstance[]> = useSignal<Array<VariableInstance>>([]);

    const allPageVariablesSignalInstance: Signal.State<VariableInstance[]> = useSignal<Array<VariableInstance>>([]);
    const allErrorsSignal = useSignal<Array<ErrorType>>([]);

    const activePageSignal = useComputed(() => {
        const activePageId = activePageIdSignal.get();
        const allPages = allPagesSignal.get();
        return allPages.find(i => i.id === activePageId)
    })
    const allApplicationVariablesSignal = useComputed<Array<Variable>>(() => applicationSignal.get().variables ?? []);
    const allPageVariablesSignal = useComputed<Array<Variable>>(() => activePageSignal.get()?.variables ?? []);
    const allContainersSignal = useComputed<Array<Container>>(() => activePageSignal.get()?.containers ?? []);
    const allApplicationFetchersSignal = useComputed<Array<Fetcher>>(() => applicationSignal.get()?.fetchers ?? []);
    const allPageFetchersSignal = useComputed<Array<Fetcher>>(() => activePageSignal.get()?.fetchers ?? []);
    const allPageCallablesSignal = useComputed<Array<Callable>>(() => activePageSignal.get()?.callables ?? []);
    const allPageQueriesSignal = useComputed<Array<Query>>(() => activePageSignal.get()?.queries ?? []);

    const allVariablesSignalInstance = useComputed(() => [...allPageVariablesSignalInstance.get(), ...allApplicationVariablesSignalInstance.get()])
    const allVariablesSignal = useComputed(() => [...allPageVariablesSignal.get(), ...allApplicationVariablesSignal.get()])
    const allFetchersSignal = useComputed(() => [...allPageFetchersSignal.get(), ...allApplicationFetchersSignal.get()])
    const allQueriesSignal = useComputed(() => [...allPageQueriesSignal.get(), ...allApplicationQueriesSignal.get()])
    const allCallablesSignal = useComputed(() => [...allPageCallablesSignal.get(), ...allApplicationCallablesSignal.get()])
    const {value, onChange} = props;
    useEffect(() => {
        const newVal = validateAndFixAppMeta(value);
        if(newVal !== value){
            applicationSignal.set(newVal);
        }
        if (newVal && newVal.pages && newVal.pages.length > 0) {
            const currentActivePageId = activePageIdSignal.get();
            const hasSelection = newVal.pages.findIndex(i => i.id === currentActivePageId) >= 0;
            if (!hasSelection) {
                allErrorsSignal.set([]);
                variableInitialValueSignal.set({});
                activePageIdSignal.set(newVal.pages[0].id);
            }
        }
    }, [activePageIdSignal, allErrorsSignal, applicationSignal, value, variableInitialValueSignal]);
    const isInit = useRef(true);
    useSignalEffect(() => {
        const application = applicationSignal.get();
        if(isInit.current){
            isInit.current = false;
            return;
        }
        onChange(application);
    })

    const navigate = useMemo(() => {
        return async function navigate(path: string, param?: Record<string, unknown> & {
            transientNavigation?: boolean
        }) {
            const isDesignMode = uiDisplayModeSignal.get() === 'design'
            if(isDesignMode) {
                return;
            }
            const page = allPagesSignal.get().find(p => p.name === path);
            if (page === undefined) {
                return;
            }
            if (uiDisplayModeSignal && uiDisplayModeSignal.get() === 'design') {
                return;
            }
            navigationStackRef.current.unshift({path, param});
            allErrorsSignal.set([]);
            variableInitialValueSignal.set(param as Record<string, unknown> ?? {});
            activePageIdSignal.set(page.id);
        }
    }, [activePageIdSignal, allErrorsSignal, allPagesSignal, uiDisplayModeSignal, variableInitialValueSignal]);

    const navigateBack = useMemo(() => {
        return async function navigateBack() {
            if(navigationStackRef.current.length === 1){
                return;
            }
            navigationStackRef.current.shift(); // throw last insert
            let prevNavigation = navigationStackRef.current.shift();
            while (prevNavigation && prevNavigation.param
            && typeof prevNavigation.param === 'object'
            && 'transientNavigation' in prevNavigation.param
            && prevNavigation.param.transientNavigation === true) {
                prevNavigation = navigationStackRef.current.shift();
            }
            if (prevNavigation?.path) {
                await navigate(prevNavigation.path, prevNavigation?.param as Record<string, unknown>);
            }
        }
    }, [navigate]);
    return {
        applicationSignal,
        allApplicationCallablesSignal,
        allPagesSignal,
        allTablesSignal,
        activePageIdSignal,
        activeDropZoneIdSignal,
        selectedDragContainerIdSignal,
        hoveredDragContainerIdSignal,
        uiDisplayModeSignal,
        variableInitialValueSignal,
        allApplicationVariablesSignalInstance,
        allPageVariablesSignalInstance,
        allErrorsSignal,
        allApplicationVariablesSignal,
        allPageVariablesSignal,
        allContainersSignal,
        allPageFetchersSignal,
        allApplicationFetchersSignal,
        allPageCallablesSignal,
        allApplicationQueriesSignal,
        allPageQueriesSignal,

        allVariablesSignalInstance,
        allVariablesSignal,
        allFetchersSignal,
        allQueriesSignal,
        allCallablesSignal,

        navigate,
        navigateBack,
    };
}

function validateAndFixAppMeta(val: Application): Application {
    const value = structuredClone(val);
    const pages = value?.pages ?? []
    let isChanged = false;
    for (const p of pages) {
        // we iterate every container in the pages
        for (const container of p.containers) {
            // if it doesnt have children then we need to remove in the container
            if (!container.children) {
                p.containers.splice(p.containers.indexOf(container), 1);
                isChanged = true;
                continue;
            }
            for (const child of container.children) {
                const isOrphan = p.containers.findIndex(c => c.id === child) <= 0;
                if (isOrphan) {
                    isChanged = true;
                    p.containers.push({
                        type: 'title',
                        children: [],
                        parent: container.id,
                        id: child,
                        properties: {
                            title: {
                                formula: 'module.exports = "Missing Component Registry"'
                            }
                        }
                    })
                }
            }
        }
    }
    return isChanged ? value : val;
}
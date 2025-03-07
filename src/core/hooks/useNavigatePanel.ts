import {useShowModal} from "./modal/useShowModal.ts";
import {useAppContext} from "./useAppContext.ts";
import {createContext, createElement, useContext} from "react";
import {PageViewer} from "../../app/viewer/PageViewer.tsx";
import {
    AppVariableInitializationContext
} from "../../app/designer/variable-initialization/AppVariableInitialization.tsx";
import {AppDesignerContext} from "../../app/designer/AppDesignerContext.ts";

export function useNavigatePanel() {
    const showModal = useShowModal();
    const context = useAppContext();
    const {allPagesSignal, elements, applicationSignal, navigate} = context;
    let uiDisplayModeSignal:AppDesignerContext['uiDisplayModeSignal']|undefined = undefined;
    if('uiDisplayModeSignal' in context) {
        uiDisplayModeSignal = context.uiDisplayModeSignal;
    }
    const appScopesSignal = useContext(AppVariableInitializationContext);

    return async function navigatePanel(path: string, param?: Record<string, unknown>) {
        //@ts-ignore
        return await showModal(closePanel => {
            const page = allPagesSignal.get().find(p => p.name === path);
            if (page === undefined) {
                return;
            }
            if (uiDisplayModeSignal && uiDisplayModeSignal.get() === 'design') {
                alert('Please switch to view mode to navigate');
                return;
            }
            const appConfig = applicationSignal.get();
            return createElement(AppVariableInitializationContext.Provider, {value: appScopesSignal},
                createElement(ClosePanelContext.Provider, {value: closePanel},
                    createElement(PageViewer, {elements, page, appConfig, navigate, value: param})));
        })
    }
}


export const ClosePanelContext = createContext<(params?: unknown) => void>(() => {})



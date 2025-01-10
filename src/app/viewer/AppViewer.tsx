import {LayoutBuilderProps} from "../designer/LayoutBuilderProps.ts";
import {useSignalEffect} from "react-hook-signal";
import {AppVariableInitialization} from "../designer/variable-initialization/AppVariableInitialization.tsx";
import ErrorBoundary from "../../core/components/ErrorBoundary.tsx";
import {AppViewerContext} from "./context/AppViewerContext.ts";
import {ContainerElement} from "./ContainerElement.tsx";
import {isEmpty} from "../../core/utils/isEmpty.ts";
import {DefaultElements} from "../designer/DefaultElements.tsx";
import {useAppInitiator} from "../../core/hooks/useAppInitiator.tsx";
import {PageVariableInitialization} from "../designer/variable-initialization/PageVariableInitialization.tsx";
import {ModalProvider} from "../../core/modal/ModalProvider.tsx";
import {PropsWithChildren, useState} from "react";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {Container} from "../designer/AppDesigner.tsx";

/**
 * Renders the application viewer component.
 */
export default function AppViewer(props: LayoutBuilderProps & { startingPage: string }) {

    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: 10,
        background: 'linear-gradient(0deg,#666,#555)'
    }}>
        <div style={{
            background: '#444',
            borderRadius: 20,
            boxShadow: '0px 15px 20px -4px rgba(0,0,0,0.5)',
            maxWidth: 1200,
            maxHeight: 800,
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            overflow: 'auto',
            padding: 5
        }}>
            <ErrorBoundary>
                <ModalProvider>
                    <AppViewerProvider {...props}>
                        <AppVariableInitialization>
                            <PageVariableInitialization>
                                <AppViewerRoot/>
                            </PageVariableInitialization>
                        </AppVariableInitialization>
                    </AppViewerProvider>
                </ModalProvider>
            </ErrorBoundary>

        </div>
    </div>
}

function AppViewerProvider(props: PropsWithChildren<LayoutBuilderProps & { startingPage: string }>) {
    const context = useAppInitiator({...props,elements:{...DefaultElements, ...props.elements}}) as AppViewerContext
    return <AppViewerContext.Provider value={context}>
        {props.children}
    </AppViewerContext.Provider>
}

function AppViewerRoot() {
    const context = useAppContext();
    const [container, setContainer] = useState<Container | undefined>();
    useSignalEffect(() => {
        const allContainersSignal = context.allContainersSignal;
        const containers = allContainersSignal.get();
        const container = containers.find(item => isEmpty(item.parent));
        if (container) {
            setContainer(container)
        }
    })
    return <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        background: 'white',
        borderRadius: 15,
        position: 'relative'
    }}>
        {container && <ContainerElement container={container}/>}
    </div>
}
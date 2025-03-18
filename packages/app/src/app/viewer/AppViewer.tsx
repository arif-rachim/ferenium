import {LayoutBuilderProps} from "../designer/LayoutBuilderProps.ts";
import {useSignalEffect} from "react-hook-signal";
import {AppVariableInitialization} from "../designer/variable-initialization/AppVariableInitialization.tsx";
import ErrorBoundary from "../../core/components/ErrorBoundary.tsx";
import {AppViewerContext} from "./context/AppViewerContext.ts";
import {ContainerElement} from "./ContainerElement.tsx";
import {isEmpty} from "../../core/utils/isEmpty.ts";
import {DefaultElements} from "../designer/DefaultElements.tsx";
import {useAppInitiator} from "../../core/hooks/useAppInitiator.ts";
import {PageVariableInitialization} from "../designer/variable-initialization/PageVariableInitialization.tsx";
import {ModalProvider} from "../../core/modal/ModalProvider.tsx";
import {ClosePanelContext} from "../../core/hooks/useNavigatePanel.ts";
import {useState} from "react";
import {Container} from "../designer/AppDesigner.tsx";
import {motion} from "framer-motion";

/**
 * Renders the application viewer component.
 */
export default function AppViewer(props: LayoutBuilderProps & { startingPage: string }) {
    const appContext = useAppInitiator(props);
    const context = {
        ...appContext,
        elements: {...DefaultElements, ...props.elements}
    } as AppViewerContext;
    const [{container, activePageId}, setContainerAndPageId] = useState<{
        container?: Container,
        activePageId: string
    }>({
        container: context.allContainersSignal.get().find(item => isEmpty(item.parent)),
        activePageId: context.activePageIdSignal.get()
    });

    useSignalEffect(() => {
        const activePageId = context.activePageIdSignal.get();
        const container = context.allContainersSignal.get().find(item => isEmpty(item.parent));
        setContainerAndPageId({container, activePageId});
    })
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: 'linear-gradient(0deg,#666,#555)'
    }}>
        <div style={{
            // maxWidth: 1200,
            // maxHeight: 800,
            // borderRadius: 20,
            padding: 5,
            background: 'white',
            boxShadow: '0px 15px 20px -4px rgba(0,0,0,0.5)',
            display: 'flex',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            overflow: 'auto',
            position: 'relative'
        }}>
            <ErrorBoundary>
                <AppViewerContext.Provider value={context}>
                    <ModalProvider>
                        <AppVariableInitialization>
                            <PageVariableInitialization>
                                <ClosePanelContext.Provider value={context.navigateBack}>
                                    <motion.div layout={'position'} style={{
                                        // borderRadius: 15,
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        background: 'white',
                                        position: 'relative',
                                        top: 0,
                                        left: 0
                                    }} initial={{opacity: 0, scale: 0.99}} animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0, scale: 0.99}}
                                                transition={{bounce: 0}}
                                                key={activePageId}>
                                        {container && <ContainerElement container={container}/>}
                                    </motion.div>
                                </ClosePanelContext.Provider>
                            </PageVariableInitialization>
                        </AppVariableInitialization>
                    </ModalProvider>
                </AppViewerContext.Provider>

            </ErrorBoundary>


        </div>
    </div>
}

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
import ButtonGroup from "../button/ButtonGroup.tsx";
import {COLUMNS_WIDTH} from "../designer/editor/ConfigPropertyEditor.tsx";

export const screenSizes = {
    Phones: {
        width: COLUMNS_WIDTH.SM_SCREEN,
        height: 640,
        borderRadius: 40
    },
    Tablets: {
        width: COLUMNS_WIDTH.MD_SCREEN,
        height: 1024,
        borderRadius: 30
    },
    Laptops: {
        width: COLUMNS_WIDTH.LG_SCREEN,
        height: 768,
        borderRadius: 20
    },
    Monitors: {
        width: COLUMNS_WIDTH.XL_SCREEN,
        height: 1080,
        borderRadius: 0
    }
} as const

type ScreenSizeType = keyof typeof screenSizes;
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
    });
    const [screen, setScreen] = useState<ScreenSizeType>((Object.keys(screenSizes) as Array<ScreenSizeType>) [3]);
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        background: 'linear-gradient(0deg,#FFF,#CCC)'
    }}>
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            overflow: 'auto',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(140,140,122,0.3) 20%, transparent 10%) 0px 0px',
            backgroundSize: '5px 5px',
            backgroundBlendMode: 'multiply'
        }}>
            <motion.div style={{
                display: 'flex',
                margin: 5,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                justifyContent: 'center',
                zIndex: 1,
            }} layout={'position'} >
                <motion.div style={{
                    display: 'flex',
                    opacity:0
                }} whileHover={{opacity:1}}>
                <ButtonGroup buttons={(Object.keys(screenSizes) as Array<ScreenSizeType>).reduce((result, key) => {
                    result[key] = {title: key, onClick: () => setScreen(key)}
                    return result;
                }, {} as Record<ScreenSizeType, { title: string, onClick: () => void }>)} value={screen}/>
                </motion.div>
            </motion.div>

            <motion.div style={{
                maxWidth: screenSizes[screen]?.width,
                maxHeight: screen === 'Monitors' ? 'unset' : screenSizes[screen]?.height,
                borderRadius: screenSizes[screen]?.borderRadius,
                border: screen === 'Monitors' ? 'unset' : '3px solid #666',
                background: 'linear-gradient(0deg,#FAFAFA,#FFFFFF)',
                boxShadow: '0px 25px 20px -10px rgba(0,0,0,0.3) ',
                display: 'flex',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                overflow: 'auto',
                position: 'relative',
                transition: 'all 300ms ease-in-out',
                overflowX: 'hidden'
            }} >
                <ErrorBoundary>
                    <AppViewerContext.Provider value={context}>
                        <ModalProvider>
                            <AppVariableInitialization>
                                <PageVariableInitialization>
                                    <ClosePanelContext.Provider value={context.navigateBack}>
                                        <motion.div layout={'position'} style={{
                                            borderRadius: screen === 'Monitors' ? 0 : screenSizes[screen]?.borderRadius - 2,
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
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
            </motion.div>
        </div>
    </div>
}

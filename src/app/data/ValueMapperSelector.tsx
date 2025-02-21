import {CSSProperties} from "react";
import {Button} from "../button/Button.tsx";
import {useShowModal} from "../../core/hooks/modal/useShowModal.ts";
import {AppDesignerContext} from "../designer/AppDesignerContext.ts";
import {PageSchemaMapper} from "./PageSchemaMapper.tsx";
import {useAppContext} from "../../core/hooks/useAppContext.ts";

export function ValueMapperSelector(props: {
    value?: string,
    onChange: (value?: string, mapperFormula?: string) => void,
    style?: CSSProperties,
    mapperInputSchema?:string
}) {
    const showModal = useShowModal();
    const context = useAppContext<AppDesignerContext>();
    return <Button icon={props.value ? 'IoIosAnalytics' : 'IoMdRemove'} style={{...props.style,background:props.value?'rgba(100,200,0,0.2)':'unset'}} onClick={async () => {
        const value = await showModal<string | undefined | 'cancel'>(closePanel => {
            return <AppDesignerContext.Provider value={context}>
                <PageSchemaMapper
                    closePanel={closePanel}
                    value={props.value}
                    mapperInputSchema={props.mapperInputSchema}
                    mapperOutputSchema={'(Promise<string>|string|undefined)'}
                />
            </AppDesignerContext.Provider>
        });
        if (value !== 'cancel') {
            props.onChange(value);
        }
    }}>{props.value ? 'Edit Mapper' : 'Add Mapper'}</Button>
}
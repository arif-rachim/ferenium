import {useShowModal} from "../../core/hooks/modal/useShowModal.ts";
import {AppDesignerContext} from "../designer/AppDesignerContext.ts";
import {BORDER} from "../../core/style/Border.ts";
import {useAppContext} from "../../core/hooks/useAppContext.ts";
import {PageSelector} from "./PageSelector.tsx";
import {CSSProperties} from "react";
import {PageSchemaMapper} from "./PageSchemaMapper.tsx";
import {isEmpty} from "../../core/utils/isEmpty.ts";
import {Icon} from "../../core/components/icon/Icon.ts";

export function PageInputSelector(props: {
    value?: string,
    onChange: (value?: string, mapperFormula?:string) => void,
    style?: CSSProperties,
    chipColor?: CSSProperties['background'],
    hidePageName?: boolean,
    bindWithMapper?: boolean,
    mapperInputSchema?: string,
    mapperValue?: string,
}) {
    // if bind with mapper is set true then we need to introduce function to map the old code to new code
    const showModal = useShowModal();
    const context = useAppContext<AppDesignerContext>();
    const {allPagesSignal} = context;
    const {value, onChange, bindWithMapper, mapperInputSchema, mapperValue} = props;
    const page = allPagesSignal.get().find(p => p.id === value);
    async function showPageSelector() {
        const result = await showModal<string | undefined | 'cancel'>(closePanel => {
            return <AppDesignerContext.Provider value={context}>
                <PageSelector
                    closePanel={closePanel}
                    value={value}
                    pageToFilterOut={context.activePageIdSignal.get()}
                />
            </AppDesignerContext.Provider>
        });
        if(result === 'cancel'){
            return;
        }
        if (bindWithMapper === false || isEmpty(result)) {
            onChange(result);
            return;
        }
        const mapperFunction = await showModal<string | undefined | 'cancel'>(closePanel => {
            return <AppDesignerContext.Provider value={context}>
                <PageSchemaMapper
                    closePanel={closePanel}
                    value={mapperValue}
                    pageId={result}
                    mapperInputSchema={mapperInputSchema}
                />
            </AppDesignerContext.Provider>
        });
        if (mapperFunction !== 'cancel') {
            onChange(result,mapperFunction);
        }
    }

    return <div
        style={{
            border: BORDER,
            display: 'flex',
            borderRadius: 5,
            justifyContent: 'space-evenly',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '5px 5px',
            gap: 5,
            ...props.style
        }}
        onClick={showPageSelector}>
        {props.hidePageName === true && <Icon.Formula style={{fontSize: 16}}/>}
        {page && props.hidePageName !== true &&
            <div style={{
                background: props.chipColor ? props.chipColor : 'rgba(0,0,0,0.1)',
                display:'block',
                borderRadius: 5,
                borderBottom: 'unset',
                flexGrow: 1,
                padding: '0px 5px',
                overflow: 'hidden',
                textOverflow : 'ellipsis',
                whiteSpace : 'nowrap',
                direction : 'rtl',
                textAlign : 'left'
            }} title={page?.name}>
                {page?.name}
            </div>
        }
    </div>
}
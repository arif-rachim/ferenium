import {Icon} from "../../../../core/components/icon/Icon.ts";
import {Container} from "../../AppDesigner.tsx";
import {CSSProperties} from "react";


export function EmptyComponent(props:{container?:Container, dataElementId?:string,style?:CSSProperties}) {
    return <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        gap: 10
    }}>
        <Icon.Question style={{fontSize: 18}}/>
        <div>
            Oops we cant find the component to render! {props.container?.type} {props.dataElementId}
        </div>
    </div>
}

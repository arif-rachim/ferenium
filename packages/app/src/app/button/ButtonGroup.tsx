import {Button} from "./Button.tsx";
import {BORDER} from "../../core/style/Border.ts";
import {CSSProperties} from "react";

export default function ButtonGroup(props: {
    buttons: Record<string, { onClick: () => void, title: string }>,
    value: string,
    buttonStyle? : (params:{style:CSSProperties,key:string,index:number,isFirstButton:boolean,isLastButton:boolean,isSelected:boolean}) => CSSProperties
}) {
    const {value} = props;
    return <>
        {Object.keys(props.buttons).map((key, index, array) => {
            const isFirstElement = index === 0;
            const isLastElement = index === array.length - 1;
            const isSelected = value === key;
            let style = {
                borderRadius: 0,
                borderLeft: isFirstElement ? BORDER : "unset",
                borderTopLeftRadius: isFirstElement ? 20 : 0,
                borderBottomLeftRadius: isFirstElement ? 20 : 0,
                borderTopRightRadius: isLastElement ? 20 : 0,
                borderBottomRightRadius: isLastElement ? 20 : 0,
                background: isSelected ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
                color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)',
                padding: '0px 10px 2px 10px'
            } as CSSProperties;
            if(props.buttonStyle){
                style = props.buttonStyle({isFirstButton:isFirstElement,isLastButton:isLastElement,index,key,style,isSelected})
            }
            return <Button key={key}
                           style={style}
                           onClick={() => props.buttons[key].onClick()}>{props.buttons[key].title}</Button>
        })}
    </>
}
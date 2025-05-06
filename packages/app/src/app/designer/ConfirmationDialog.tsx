import {FormEvent, PropsWithChildren, ReactNode} from "react";
import {Button} from "../button/Button.tsx";
import {BORDER} from "../../core/style/Border.ts";
import {IconType} from "../../core/components/icon/IconElement.tsx";
import * as Io from "react-icons/io";
import {IoIosHelpCircle} from "react-icons/io";
import {isNotEmpty} from "../../core/utils/isNotEmpty.ts";

const defaultButtons = [{id: 'Yes', label: 'Yes', icon: 'IoIosSave'}, {
    id: 'No',
    label: 'No',
    icon: 'IoIosExit'
}] as Array<{ id: string, label: string, icon?: IconType, onClick?: () => void, type?: 'button' | 'reset' | 'submit' }>;
type ButtonType = {
    id: string,
    label: string,
    icon?: IconType,
    onClick?: () => void,
    type?: 'button' | 'submit' | 'reset'
};
/**
 * Creates a confirmation dialog with the given properties.
 */
export function ConfirmationDialog(props: PropsWithChildren<{
    message?: ReactNode,
    title?: string,
    icon?: IconType,
    closePanel?: (result?: string) => void,
    onSubmit?: (event: FormEvent) => void,
    buttons?: Array<ButtonType> | ReactNode,
}>) {
    const buttons = props.buttons ?? defaultButtons;
    const isNormalButtons = Array.isArray(buttons) && buttons.length > 0 && 'label' in buttons[0];
    const isReactNodeButtons = !isNormalButtons;
    const Icon = props.icon && props.icon in Io ? Io[props.icon] : IoIosHelpCircle;
    const hasMessage = isNotEmpty(props.message);
    const messageIsString = typeof props.message === "string";
    return <form style={{display: 'flex', flexDirection: 'column', gap: 10}} onSubmit={props.onSubmit}>
        <div style={{
            padding: '10px 20px',
            borderBottom: BORDER,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            gap: 5,
            alignItems: 'center'
        }}>
            {Icon && <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon
                style={{fontSize: 32, color: 'rgba(0,0,0,0.7)'}}/></div>}
            <div>{props.title ?? 'Confirmation'}</div>
        </div>
        {hasMessage && messageIsString &&
            <div style={{padding: '10px 20px'}} dangerouslySetInnerHTML={{__html: props.message as string}}></div>}
        {hasMessage && !messageIsString && <div style={{padding: '10px 20px'}}>{props.message}</div>}
        {props.children}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 5,
            borderTop: BORDER,
            padding: '10px 20px',
            background: 'rgba(0,0,0,0.05)'
        }}>
            {isNormalButtons && buttons.map((button) => {
                return <Button key={button.id}
                               type={button.type ?? 'button'}
                               allowOnFormDisabled={true}
                               onClick={() => {
                                   if (button.onClick) {
                                       button.onClick();
                                   } else if (props.closePanel) {
                                       props.closePanel(button.id)
                                   }
                               }}
                               style={{
                                   display: 'flex',
                                   gap: 5,
                                   alignItems: 'center'
                               }} icon={button.icon}>
                    {button.label}
                </Button>
            })}
            {isReactNodeButtons && (buttons as ReactNode)}
        </div>
    </form>
}
import {Button} from "../../../button/Button.tsx";
import {Icon} from "../../../../core/components/icon/Icon.ts";
import {BORDER} from "../../../../core/style/Border.ts";

const green = 'green';
const red = 'red';

export function PropertyEditorComponent(props:{isFormulaEmpty: boolean, onClick: () => void, hasError: boolean}) {
    const {isFormulaEmpty,onClick,hasError} = props;
    return <div style={{display: 'flex'}}>
        <Button style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            backgroundColor: isFormulaEmpty ? 'rgba(255,255,255,0.9)' : green,
            color: isFormulaEmpty ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)',
            padding: '0px 5px'
        }} onClick={onClick}><Icon.Formula style={{fontSize: 16}}/></Button>
        <div style={{
            display: 'flex',
            padding: '0px 5px',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            border: BORDER,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20
        }}>
            {hasError && <Icon.Error style={{fontSize: 16, color: red}}/>}
            {!hasError && <Icon.Checked style={{fontSize: 16, color: green}}/>}
        </div>
    </div>;
}

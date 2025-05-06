import {BORDER} from "../../../../core/style/Border.ts";
import {Button} from "../../../button/Button.tsx";
import {colors} from "../../../../core/style/colors.ts";

export function SimpleTableFooter(props: {
    totalPages: number,
    value: number,
    onChange: (value: number) => void,
    buttonCount?: number
}) {
    const {totalPages, value, onChange, buttonCount} = props;
    const maxButtons = buttonCount ? buttonCount : 7;
    const halfRange = Math.floor(maxButtons / 2);
    let startPage = Math.max(value - halfRange, 1);
    const endPage = Math.min(startPage + maxButtons - 1, totalPages);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(endPage - maxButtons + 1, 1);
    }

    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return <div
        style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            borderTop: BORDER,
            padding: 5,
            background: '#F2F2F2',
        }}>
        <Button style={{
            padding: 0,
            paddingBottom: 2,
            width: 50,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            background: 'white',
            border: 'unset'
        }} onClick={() => onChange(value - 1)}
                disabled={value === 1}
        >Prev
        </Button>
        {pages.map(page => {
            const isSelected = page === value;
            return <Button style={{
                padding: 0,
                paddingBottom: 2,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? 'white' : '#666',
                background: isSelected ? colors.blue : 'white',
                border: 'unset'
            }} key={page}
                           onClick={() => onChange(page)}
            >{page}</Button>
        })}
        <Button style={{
            padding: 0,
            paddingBottom: 2,
            width: 50,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            background: 'white',
            border: 'unset'

        }} onClick={() => onChange(value + 1)}
                disabled={value === totalPages}
        >Next
        </Button>
    </div>
}

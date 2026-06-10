import styles from './css/input.css';

export interface DropdownOption {
    value: string;
    label: string;
}

export interface DropdownProps {
    id: string;
    label: string;
    options: DropdownOption[];
    style?: string;
    containerStyle?: string;
}

export class Dropdown {
    static render(props: DropdownProps): string {
        const optionsHtml = props.options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');

        const styleAttr = props.style ? `style="${props.style}"` : '';
        const containerStyle = props.containerStyle !== undefined ? props.containerStyle : 'margin-bottom: 16px;';
        const labelHtml = props.label ? `<label class="${styles.label}">${props.label}</label>` : '';

        return `
            <div style="${containerStyle}">
                ${labelHtml}
                <select id="${props.id}" class="${styles.select}" ${styleAttr}>
                    ${optionsHtml}
                </select>
            </div>
        `;
    }
}

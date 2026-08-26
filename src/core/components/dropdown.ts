import styles from '@/core/components/css/input.css';

interface DropdownOption {
    value: string;
    label: string;
}

export interface DropdownProps {
    id: string;
    label: string;
    options: DropdownOption[];
}

export class Dropdown {
    static render(props: DropdownProps): string {
        const optionsHtml = props.options.map(opt => 
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');

        const labelHtml = props.label ? `<label class="${styles.label}">${props.label}</label>` : '';

        return `
            <div style="margin-bottom: 16px;">
                ${labelHtml}
                <select id="${props.id}" class="${styles.select}">
                    ${optionsHtml}
                </select>
            </div>
        `;
    }
}

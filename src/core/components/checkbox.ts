import styles from './css/input.css';

export interface CheckboxProps {
    id: string;
    label: string;
    checked?: boolean;
}

export class Checkbox {
    static render(props: CheckboxProps): string {
        const checkedAttr = props.checked ? 'checked' : '';
        
        return `
            <div style="margin-bottom: 16px; display: flex; align-items: center;">
                <input type="checkbox" id="${props.id}" ${checkedAttr} style="margin-right: 8px; cursor: pointer;">
                <label for="${props.id}" class="${styles.label}" style="margin-bottom: 0; cursor: pointer;">${props.label}</label>
            </div>
        `;
    }
}

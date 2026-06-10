import styles from './css/input.css';

export interface TextareaProps {
    id: string;
    label: string;
    placeholder?: string;
    rows?: number;
    topRightElement?: string;
}

export class Textarea {
    static render(props: TextareaProps): string {
        const placeholder = props.placeholder ? `placeholder="${props.placeholder}"` : '';
        const rows = props.rows || 5;
        const topRight = props.topRightElement || '';

        return `
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px;">
                    <label class="${styles.label}" style="margin-bottom: 0;">${props.label}</label>
                    ${topRight}
                </div>
                <textarea id="${props.id}" class="${styles.textarea}" rows="${rows}" ${placeholder}></textarea>
            </div>
        `;
    }
}

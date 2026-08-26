import styles from '@/core/components/css/input.css';

export interface TextareaProps {
    id: string;
    label: string;
    placeholder?: string;
    rows?: number;
}

export class Textarea {
    static render(props: TextareaProps): string {
        const placeholder = props.placeholder ? `placeholder="${props.placeholder}"` : '';
        const rows = props.rows || 5;

        return `
            <div style="margin-bottom: 16px;">
                <label class="${styles.label}" style="margin-bottom: 6px; display: block;">${props.label}</label>
                <textarea id="${props.id}" class="${styles.textarea}" rows="${rows}" ${placeholder}></textarea>
            </div>
        `;
    }
}

import styles from '@/core/components/css/button.css';

export interface ButtonProps {
    id: string;
    text: string;
    variant?: 'primary' | 'secondary';
}

export class Button {
    static render(props: ButtonProps): string {
        return `
            <button id="${props.id}" class="${styles.button} ${props.variant === 'secondary' ? styles.secondary : styles.primary}">
                ${props.text}
            </button>
        `;
    }
}

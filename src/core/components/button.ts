import styles from './css/button.css';

export interface ButtonProps {
    id: string;
    text: string;
    variant?: 'primary' | 'secondary';
    onClick?: string;
    icon?: string;
    style?: string;
}

export class Button {
    static render(props: ButtonProps): string {
        const variantClass = props.variant === 'secondary' ? styles.secondary : styles.primary;
        const onClickAttr = props.onClick ? `onclick="${props.onClick}"` : '';
        const styleAttr = props.style ? `style="${props.style}"` : '';
        const iconHtml = props.icon ? `<i class="ms-Icon ${props.icon}" style="margin-right: 4px;"></i> ` : '';
        
        return `
            <button id="${props.id}" class="${styles.button} ${variantClass}" ${onClickAttr} ${styleAttr}>
                ${iconHtml}${props.text}
            </button>
        `;
    }
}

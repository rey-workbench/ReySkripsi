import styles from './css/card.css';

export interface CardProps {
    id: string;
    icon: string;
    title: string;
    backgroundColor?: string;
    iconColor?: string;
}

export class Card {
    static render(props: CardProps): string {
        const bg = props.backgroundColor || '#eff6ff';
        const color = props.iconColor || '#3b82f6';
        
        return `
            <div class="${styles.card}" data-module="${props.id}">
                <div class="${styles.icon}" style="background-color: ${bg};">
                    <i class="ms-Icon ${props.icon}" style="color: ${color}; font-size: 24px;"></i>
                </div>
                <span class="${styles.label}">${props.title}</span>
            </div>
        `;
    }
}

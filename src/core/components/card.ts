import styles from '@/core/components/css/card.css';

export interface CardProps {
    id: string;
    icon: string;
    title: string;
    iconColor?: string;
}

export class Card {
    static render(props: CardProps): string {
        return `
            <div class="${styles.card}" data-module="${props.id}">
                <div class="${styles.icon}" style="background-color: #eff6ff;">
                    <i class="ms-Icon ${props.icon}" style="color: ${props.iconColor || '#3b82f6'}; font-size: 24px;"></i>
                </div>
                <span class="${styles.label}">${props.title}</span>
            </div>
        `;
    }
}

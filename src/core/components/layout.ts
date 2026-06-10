import layoutStyles from './css/module-layout.css';

export interface LayoutProps {
    id: string;
    title: string;
    content: string;
}

export class Layout {
    static render(props: LayoutProps): string {
        return `
            <div id="${props.id}" class="screen">
                <div class="${layoutStyles.header}">
                    <button class="${layoutStyles.backButton}" data-back-button="true">
                        <i class="ms-Icon ms-Icon--Back"></i>
                    </button>
                    <h2 class="ms-font-l" style="margin: 0; font-weight: 600; color: #1f2937;">${props.title}</h2>
                </div>
                <div class="${layoutStyles.content}">
                    ${props.content}
                </div>
            </div>
        `;
    }
}

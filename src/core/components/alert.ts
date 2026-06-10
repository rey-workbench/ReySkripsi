export interface AlertProps {
    title?: string;
    message: string;
    type?: 'info' | 'warning' | 'error';
    style?: string;
}

export class Alert {
    static render(props: AlertProps): string {
        const type = props.type || 'info';
        
        let bg = '#eef2ff';
        let border = '#3b82f6';
        let titleColor = '#1e40af';
        let textColor = '#3730a3';
        let icon = 'ms-Icon--Info';
        
        if (type === 'warning') {
            bg = '#fffbeb';
            border = '#f59e0b';
            titleColor = '#92400e';
            textColor = '#92400e';
            icon = 'ms-Icon--Warning';
        } else if (type === 'error') {
            bg = '#fef2f2';
            border = '#ef4444';
            titleColor = '#991b1b';
            textColor = '#991b1b';
            icon = 'ms-Icon--Error';
        }

        const titleHtml = props.title ? `<strong style="color: ${titleColor}; font-size: 12px; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;"><i class="ms-Icon ${icon}"></i> ${props.title}</strong>` : '';
        const extraStyle = props.style ? props.style : '';

        return `
            <div style="background-color: ${bg}; border-left: 4px solid ${border}; padding: 12px; border-radius: 4px; ${extraStyle}">
                ${titleHtml}
                <div style="color: ${textColor}; font-size: 12px; line-height: 1.5;">${props.message}</div>
            </div>
        `;
    }
}

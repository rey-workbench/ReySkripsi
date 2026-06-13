import styles from '../components/css/loading.css';
import { DOMService } from './dom-service';

export class LoadingService {
    static show(text: string = "Memproses...") {
        const innerHTML = `
            <div class="${styles.spinner || 'spinner'}"></div>
            <div id="loading-text" class="${styles['loading-text'] || 'loading-text'}"></div>
        `;
        const overlay = DOMService.getOrCreateElement('loading-overlay', styles['loading-overlay'] || 'loading-overlay', innerHTML);

        const textEl = document.getElementById('loading-text');
        if (textEl) {
            textEl.textContent = text;
        }

        // Add class to show it
        // Note: we might need a small timeout to allow CSS transitions to work if just appended
        requestAnimationFrame(() => {
            if (overlay) overlay.classList.add(styles.show || 'show');
        });
    }

    static hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove(styles.show || 'show');
        }
    }
}

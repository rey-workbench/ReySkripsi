import styles from '../components/css/loading.css';

export class LoadingService {
    static show(text: string = "Memproses...") {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = styles['loading-overlay'] || 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = styles.spinner || 'spinner';
            
            const textEl = document.createElement('div');
            textEl.id = 'loading-text';
            textEl.className = styles['loading-text'] || 'loading-text';
            
            overlay.appendChild(spinner);
            overlay.appendChild(textEl);
            document.body.appendChild(overlay);
        }

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

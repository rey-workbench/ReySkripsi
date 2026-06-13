import styles from '../components/css/toast.css';
import { DOMService } from './dom-service';

export class ToastService {
  public static show(message: string, isError: boolean = false) {
    const toast = DOMService.getOrCreateElement('toast-container', styles.toast);
    
    // Reset classes
    toast.className = styles.toast;
    if (isError) {
        toast.classList.add(styles.error);
    }
    
    toast.textContent = message;
    toast.classList.add(styles.show);

    if (!isError) {
        setTimeout(() => {
            this.hide();
        }, 5000);
    }
  }

  public static showProgress(message: string, percent: number, onCancel?: () => void) {
    const toast = DOMService.getOrCreateElement('toast-container', styles.toast);
    
    // Setup for progress
    toast.className = `${styles.toast} ${styles.progress} ${styles.show}`;
    
    toast.innerHTML = `
      <div class="${styles['toast-progress-header']}">
        <span>${message}</span>
        ${onCancel ? `<button id="toast-cancel-btn" class="${styles['toast-cancel-btn']}">Batal</button>` : ''}
      </div>
      <div class="${styles['toast-progress-bar-container']}">
        <div class="${styles['toast-progress-bar']}" style="width: ${percent}%;"></div>
      </div>
    `;

    if (onCancel) {
      const cancelBtn = document.getElementById('toast-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', onCancel);
      }
    }
  }

  public static hide() {
    const currentToast = document.getElementById('toast-container');
    if (currentToast) {
        currentToast.classList.remove(styles.show);
    }
  }
}

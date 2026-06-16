import styles from '../../components/css/toast.css';
import { DOMService } from './dom-service';

export class ToastService {
  public static show(message: string, isError: boolean = false, keepOpen: boolean = false) {
    const toast = DOMService.getOrCreateElement('toast-container', styles.toast);
    
    // Reset classes
    toast.className = styles.toast;
    if (isError) {
        toast.classList.add(styles.error);
    }
    
    if (keepOpen) {
       toast.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; text-align: left; gap: 12px;">
            <span>${message}</span>
            <button id="toast-close-btn" class="${styles['toast-cancel-btn']}">OK</button>
          </div>
       `;
       setTimeout(() => {
          const btn = document.getElementById('toast-close-btn');
          if (btn) btn.onclick = () => this.hide();
       }, 0);
    } else {
       toast.textContent = message;
       if (!isError) {
           setTimeout(() => {
               this.hide();
           }, 5000);
       }
    }

    toast.classList.add(styles.show);
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

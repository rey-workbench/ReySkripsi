import styles from '@/core/components/css/toast.css';
function getOrCreateToast(): HTMLElement {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = styles.toast;
    document.body.appendChild(el);
  }
  return el;
}

export class ToastService {
  public static show(message: string, isError: boolean = false) {
    const toast = getOrCreateToast();
    toast.className = styles.toast;
    if (isError) {
        toast.classList.add(styles.error);
    }
    toast.textContent = message;
    if (!isError) {
        setTimeout(() => {
            this.hide();
        }, 5000);
    }

    toast.classList.add(styles.show);
  }

  public static showProgress(message: string, percent: number, onCancel?: () => void) {
    const toast = getOrCreateToast();
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

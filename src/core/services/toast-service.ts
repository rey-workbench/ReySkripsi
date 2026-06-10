import styles from '../components/css/toast.css';

export class ToastService {
  public static show(message: string, isError: boolean = false) {
    let toast = document.getElementById('toast-container');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
        toast.className = styles.toast;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    
    if (isError) {
        toast.classList.add(styles.error);
    } else {
        toast.classList.remove(styles.error);
    }

    // Trigger animation
    toast.classList.add(styles.show);

    if (!isError && !message.includes("Processing") && !message.includes("Scanning") && !message.includes("Applying")) {
        setTimeout(() => {
            const currentToast = document.getElementById('toast-container');
            if (currentToast) {
                currentToast.classList.remove(styles.show);
            }
        }, 5000);
    }
  }
}

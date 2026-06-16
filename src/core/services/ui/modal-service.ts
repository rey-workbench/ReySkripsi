import styles from '../../components/css/modal.css';
import btnStyles from '../../components/css/button.css';
import { DOMService } from './dom-service';

export class ModalService {
  public static showConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const innerHTML = `
            <div class="${styles.content}">
                <h3 id="modal-title" class="ms-font-l" style="margin-top: 0;"></h3>
                <p id="modal-message" class="ms-font-m"></p>
                <div class="${styles.actions}" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;">
                    <button id="modal-btn-cancel" class="${btnStyles.button} ${btnStyles.secondary}">Batal</button>
                    <button id="modal-btn-confirm" class="${btnStyles.button} ${btnStyles.primary}">OK</button>
                </div>
            </div>
        `;
        const modal = DOMService.getOrCreateElement('confirmation-modal', styles.overlay, innerHTML);

        const modalMessage = document.getElementById("modal-message");
        const btnCancel = document.getElementById("modal-btn-cancel");
        const btnConfirm = document.getElementById("modal-btn-confirm");

        if (!modal || !modalMessage || !btnCancel || !btnConfirm) {
            resolve(true); // Fallback if UI is missing
            return;
        }

        modalMessage.innerText = message;
        modal.style.display = "flex";

        const cleanup = () => {
            modal!.style.display = "none";
            btnCancel.removeEventListener("click", onCancel);
            btnConfirm.removeEventListener("click", onConfirm);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        btnCancel.addEventListener("click", onCancel);
        btnConfirm.addEventListener("click", onConfirm);
    });
  }

  public static showAlert(title: string, message: string): Promise<void> {
    return new Promise((resolve) => {
        const innerHTML = `
            <div class="${styles.content}">
                <h3 class="ms-font-l" style="margin-top: 0;">${title}</h3>
                <p id="alert-message" class="ms-font-m"></p>
                <div class="${styles.actions}" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <button id="alert-btn-ok" class="${btnStyles.button} ${btnStyles.primary}">OK</button>
                </div>
            </div>
        `;
        const modal = DOMService.getOrCreateElement('alert-modal', styles.overlay, innerHTML);
        const modalMessage = document.getElementById("alert-message");
        const btnOk = document.getElementById("alert-btn-ok");

        if (!modal || !modalMessage || !btnOk) {
            resolve();
            return;
        }

        modalMessage.innerText = message;
        modal.style.display = "flex";

        btnOk.onclick = () => {
            modal.style.display = "none";
            resolve();
        };
    });
  }

  public static showProgress(message: string, percent: number, onCancel?: () => void) {
    let modal = document.getElementById('progress-modal');
    if (!modal) {
        const innerHTML = `
            <div class="${styles.content}">
                <h3 class="ms-font-l" style="margin-top: 0; margin-bottom: 15px;">Memproses Dokumen...</h3>
                <div style="margin-bottom: 15px;">
                    <p id="modal-progress-message" class="ms-font-m" style="margin-bottom: 8px;">${message}</p>
                    <div style="height: 8px; background-color: #f3f2f1; border-radius: 4px; overflow: hidden; width: 100%;">
                        <div id="modal-progress-bar" style="height: 100%; background-color: #0078d4; width: ${percent}%; transition: width 0.2s ease;"></div>
                    </div>
                </div>
                <div id="modal-progress-actions" class="${styles.actions}" style="display: flex; justify-content: flex-end;">
                </div>
            </div>
        `;
        modal = DOMService.getOrCreateElement('progress-modal', styles.overlay, innerHTML);
    }
    
    modal.style.display = "flex";
    
    const msgEl = document.getElementById("modal-progress-message");
    const barEl = document.getElementById("modal-progress-bar");
    const actionsEl = document.getElementById("modal-progress-actions");

    if (msgEl) msgEl.innerText = message;
    if (barEl) barEl.style.width = `${percent}%`;
    
    if (actionsEl) {
       if (onCancel) {
           if (!document.getElementById("modal-btn-cancel-progress")) {
               actionsEl.innerHTML = `<button id="modal-btn-cancel-progress" class="${btnStyles.button} ${btnStyles.cancel}">Batal</button>`;
           }
           const btnCancel = document.getElementById("modal-btn-cancel-progress");
           if (btnCancel) {
               btnCancel.onclick = onCancel;
           }
       } else {
           actionsEl.innerHTML = '';
       }
    }
  }

  public static hideProgress() {
      const modal = document.getElementById('progress-modal');
      if (modal) {
          modal.style.display = "none";
      }
  }
}

import styles from '../components/css/modal.css';
import btnStyles from '../components/css/button.css';
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
}

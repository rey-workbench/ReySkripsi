import { IModule } from '@/core/interfaces';
import { ToastService } from '@/core/services/ui/toast-service';
import { StorageService } from '@/core/services/storage/storage-service';

export class SettingsModule implements IModule {
  public id = "module-settings";
  public name = "Settings";
  public iconClass = "ms-Icon--Settings";
  public iconColor = "#6b7280";

  public get htmlContent(): string {
    return `
      <p class="ms-font-s" style="margin-bottom: 20px; color: #4b5563;">
        Pengaturan Kunci API (API Key) terenkripsi untuk fitur AI pada ReySkripsi.
      </p>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label class="ms-fontWeight-semibold" style="display: block; margin-bottom: 6px; font-size: 13px; color: #1e293b;">
            Gemini API Key
          </label>
          <input type="password" id="settings-gemini-key" class="ms-TextField-field" placeholder="Masukkan Gemini API Key..." style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" />
          <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">Tersimpan aman & terenkripsi di IndexedDB Lokal.</span>
        </div>

        <div>
          <label class="ms-fontWeight-semibold" style="display: block; margin-bottom: 6px; font-size: 13px; color: #1e293b;">
            NVIDIA API Key (Opsional)
          </label>
          <input type="password" id="settings-nvidia-key" class="ms-TextField-field" placeholder="Masukkan NVIDIA API Key..." style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 13px; outline: none;" />
          <span style="font-size: 11px; color: #64748b; margin-top: 4px; display: block;">Tersimpan aman & terenkripsi di IndexedDB Lokal.</span>
        </div>

        <button id="settings-btn-save" style="background: #0078D4; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; margin-top: 8px; transition: background 0.2s;" onmouseover="this.style.background='#005a9e'" onmouseout="this.style.background='#0078D4'">
          Simpan Pengaturan
        </button>
      </div>
    `;
  }

  public async onInit(): Promise<void> {
    const geminiInput = document.getElementById("settings-gemini-key") as HTMLInputElement;
    const nvidiaInput = document.getElementById("settings-nvidia-key") as HTMLInputElement;
    const btnSave = document.getElementById("settings-btn-save");

    if (geminiInput) geminiInput.value = await StorageService.getItem("gemini_api_key");
    if (nvidiaInput) nvidiaInput.value = await StorageService.getItem("nvidia_api_key");

    if (btnSave) {
      btnSave.addEventListener("click", async () => {
        const geminiVal = geminiInput?.value.trim() || "";
        const nvidiaVal = nvidiaInput?.value.trim() || "";

        await StorageService.setItem("gemini_api_key", geminiVal);
        await StorageService.setItem("nvidia_api_key", nvidiaVal);

        ToastService.show("API Key berhasil disimpan & terenkripsi secara aman!");
      });
    }
  }
}

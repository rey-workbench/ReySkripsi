/// <reference types="office-js" />
import { CaptionService, ICaptionStyleOptions } from '../../core/services/word/caption-service';
import { ToastService } from '../../core/services/ui/toast-service';
import { ModalService } from '../../core/services/ui/modal-service';
import { StorageService } from '../../core/services/storage/storage-service';
import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { Dropdown } from '../../core/components/dropdown';
import { Textarea } from '../../core/components/textarea';
import { Checkbox } from '../../core/components/checkbox';

export class AutoCaptionModule implements IModule {
  public id = "module-caption";
  public name = "Auto Caption Bab";
  public iconClass = "ms-Icon--TableGroup";
  public iconColor = "#0078D4";

  public get htmlContent(): string {
    return `
      <p class="ms-font-s" style="margin-bottom: 16px; color: #4b5563;">
        Penyisipan caption otomatis untuk Tabel & Gambar berdasar nomor BAB (Contoh: <b>Tabel 1.1</b>, <b>Tabel 1.2</b> pada BAB I).
      </p>

      ${Dropdown.render({
        id: 'caption-label-select',
        label: 'Tipe Label Caption',
        options: [
          { value: 'Tabel', label: 'Tabel (Posisi di Atas)' },
          { value: 'Gambar', label: 'Gambar (Posisi di Bawah)' }
        ]
      })}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        ${Dropdown.render({
          id: 'caption-size-select',
          label: 'Ukuran Font',
          options: [
            { value: 'auto', label: 'Otomatis' },
            { value: '12', label: '12 pt (Skripsi)' },
            { value: '11', label: '11 pt' },
            { value: '10', label: '10 pt' }
          ]
        })}
        ${Dropdown.render({
          id: 'caption-align-select',
          label: 'Rata Posisi',
          options: [
            { value: 'centered', label: 'Rata Tengah' },
            { value: 'left', label: 'Rata Kiri' },
            { value: 'right', label: 'Rata Kanan' }
          ]
        })}
      </div>

      <div style="display: flex; gap: 16px; margin-top: 8px; margin-bottom: 12px;">
        ${Checkbox.render({
          id: 'caption-bold-check',
          label: 'Cetak Tebal (Bold)',
          checked: true
        })}
        ${Checkbox.render({
          id: 'caption-italic-check',
          label: 'Cetak Miring (Italic)',
          checked: false
        })}
      </div>

      <div style="margin-top: 8px;">
        ${Textarea.render({
          id: 'caption-title-input',
          label: 'Judul / Deskripsi Manual (Atau dikosongi untuk AI)',
          placeholder: 'Contoh: Hasil Pengujian Akurasi Model',
          rows: 2
        })}
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 20px;">
        ${Button.render({
          id: 'btn-insert-caption',
          text: 'Sisipkan Caption di Kursor',
          variant: 'primary'
        })}
        ${Button.render({
          id: 'btn-autocaption-tables',
          text: 'Auto Caption Seluruh Tabel Dokumen',
          variant: 'secondary'
        })}
      </div>
    `;
  }

  public onInit(): void {
    const btnInsert = document.getElementById("btn-insert-caption");
    const btnAutoTables = document.getElementById("btn-autocaption-tables");

    if (btnInsert) {
      btnInsert.addEventListener("click", () => this.insertCaption());
    }
    if (btnAutoTables) {
      btnAutoTables.addEventListener("click", () => this.autoCaptionAllTables());
    }
  }

  private getStyleOptions(): ICaptionStyleOptions {
    const sizeSelect = document.getElementById("caption-size-select") as HTMLSelectElement;
    const alignSelect = document.getElementById("caption-align-select") as HTMLSelectElement;
    const boldCheck = document.getElementById("caption-bold-check") as HTMLInputElement;
    const italicCheck = document.getElementById("caption-italic-check") as HTMLInputElement;

    const val = sizeSelect?.value;
    const customFontSize = (val && val !== 'auto') ? parseInt(val, 10) : undefined;
    const alignment = (alignSelect?.value || 'centered') as 'centered' | 'left' | 'right';

    return {
      isBold: boldCheck ? boldCheck.checked : true,
      isItalic: italicCheck ? italicCheck.checked : false,
      alignment: alignment,
      customFontSize: customFontSize
    };
  }

  private async insertCaption() {
    const labelSelect = document.getElementById("caption-label-select") as HTMLSelectElement;
    const titleInput = document.getElementById("caption-title-input") as HTMLTextAreaElement;

    const label = (labelSelect?.value || "Tabel") as 'Tabel' | 'Gambar';
    let title = titleInput?.value.trim() || "";
    const options = this.getStyleOptions();
    const apiKey = await StorageService.getItem("gemini_api_key");
    const model = "gemini-2.5-flash-lite";

    try {
      ToastService.showProgress("Membuat caption...", 30);

      if (apiKey && !title && label === 'Tabel') {
        ToastService.showProgress(`AI menganalisis & merangkum tabel (maks 4 kata)...`, 60);
        const tableText = await CaptionService.getSelectedTableDataText();
        if (tableText) {
          title = await CaptionService.generateAiCaptionTitle(tableText, apiKey, model);
        }
      }

      const insertedCaption = await CaptionService.insertCaptionForSelection(label, title, options);
      ToastService.show(`Berhasil menyisipkan caption!`);
    } catch (e: any) {
      console.error(e);
      ToastService.show("Gagal menyisipkan caption: " + e.message, true);
    } finally {
      ToastService.hide();
    }
  }

  private async autoCaptionAllTables() {
    const isConfirmed = await ModalService.showConfirmation(
      "Apakah Anda yakin ingin memberi caption otomatis 'Tabel X.Y' ke seluruh tabel di dalam dokumen ini?"
    );

    if (!isConfirmed) return;

    const options = this.getStyleOptions();
    const apiKey = await StorageService.getItem("gemini_api_key");
    const model = "gemini-2.5-flash-lite";

    try {
      ToastService.showProgress("Memproses seluruh tabel dokumen...", 30);
      const aiConfig = apiKey ? { apiKey: apiKey, model: model } : undefined;
      const count = await CaptionService.autoCaptionAllTables(options, aiConfig);
      ToastService.show(`Berhasil memberi caption otomatis pada ${count} tabel!`);
    } catch (e: any) {
      console.error(e);
      ToastService.show("Gagal memproses tabel: " + e.message, true);
    } finally {
      ToastService.hide();
    }
  }
}

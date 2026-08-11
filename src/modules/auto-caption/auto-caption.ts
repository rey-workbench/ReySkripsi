/// <reference types="office-js" />
import { CaptionService } from '../../core/services/word/caption-service';
import { ToastService } from '../../core/services/ui/toast-service';
import { ModalService } from '../../core/services/ui/modal-service';
import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { Dropdown } from '../../core/components/dropdown';
import { Textarea } from '../../core/components/textarea';

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

      <div style="margin-top: 12px;">
        ${Textarea.render({
          id: 'caption-title-input',
          label: 'Judul / Deskripsi Caption (Opsional)',
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

  private async insertCaption() {
    const labelSelect = document.getElementById("caption-label-select") as HTMLSelectElement;
    const titleInput = document.getElementById("caption-title-input") as HTMLTextAreaElement;

    const label = (labelSelect?.value || "Tabel") as 'Tabel' | 'Gambar';
    const title = titleInput?.value.trim() || "";

    try {
      ToastService.showProgress("Membuat caption...", 50);
      const insertedCaption = await CaptionService.insertCaptionForSelection(label, title);
      ToastService.show(`Berhasil menyisipkan: "${insertedCaption}"`);
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

    try {
      ToastService.showProgress("Memproses seluruh tabel dokumen...", 30);
      const count = await CaptionService.autoCaptionAllTables();
      ToastService.show(`Berhasil memberi caption otomatis pada ${count} tabel!`);
    } catch (e: any) {
      console.error(e);
      ToastService.show("Gagal memproses tabel: " + e.message, true);
    } finally {
      ToastService.hide();
    }
  }
}

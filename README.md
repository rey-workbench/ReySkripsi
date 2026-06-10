# ReySkripsi - Microsoft Word Add-in

ReySkripsi adalah add-in Microsoft Word yang dirancang khusus untuk mempermudah proses merapikan dan memformat dokumen karya ilmiah atau skripsi. 

## Fitur Utama

- **Deteksi Kata Asing:** Otomatis menandai atau mengubah kata asing/typo yang tidak ada di dalam Kamus Besar Bahasa Indonesia (KBBI).
- **Format Typografi:** Memperbaiki format tulisan secara instan.
- **Dukungan Penuh:** Bekerja dengan baik di Word untuk Web maupun Word Desktop (Windows/Mac).

---

## Demo Aplikasi

Berikut adalah tampilan fitur dan kemampuan ReySkripsi saat digunakan di Microsoft Word:

### Antarmuka Add-in

| Menu Utama | Fitur Auto Language | Fitur Batch Manual |
| :---: | :---: | :---: |
| <img src="assets/demo/demo-3.png" width="250" /> | <img src="assets/demo/demo-4.png" width="250" /> | <img src="assets/demo/demo-5.png" width="250" /> |

### Instalasi dan Penggunaan

| Installer Mandiri | Integrasi di Microsoft Word |
| :---: | :---: |
| <img src="assets/demo/demo-1.png" width="350" /> | <img src="assets/demo/demo-2.png" width="350" /> |

---

## Panduan Instalasi (Word Local / Desktop)

### Persyaratan
- Microsoft Word (Windows Desktop)
- Windows 10 atau 11

### Instalasi Cepat via Installer (Rekomendasi)

Anda tidak perlu lagi melakukan setup Shared Folder atau Trust Center secara manual.

1. Unduh aplikasi `reyskripsi-manager.exe` terbaru dari [halaman GitHub Releases](https://github.com/rey-workbench/ReySkripsi/releases/latest).
2. **Klik Ganda (Double Click)** aplikasi `reyskripsi-manager.exe` tersebut.
3. Jendela Installer akan muncul. Klik tombol **Install Add-in** dan tunggu notifikasi sukses.
   <br><img src="assets/demo/demo-1.png" alt="Tutorial Install" width="450">
4. Buka aplikasi **Microsoft Word**, lalu buat dokumen kosong (Blank Document).
5. Pergi ke tab **Home** (atau Insert) > klik **Add-ins** > lalu cari menu **Developer Add-ins** (atau _My Add-ins_).
6. Klik **ReySkripsi** untuk membukanya di panel samping (Taskpane).
7. *Catatan:* Jika muncul jendela pop-up **"Debug Event-based handler"** (seperti gambar di bawah), klik tombol **Cancel** agar pesan tersebut tidak muncul lagi.
   <br><img src="assets/tutorial/tutorial-1.png" alt="Debug Popup" width="300">

### Cara Uninstall
Buka kembali aplikasi `reyskripsi-manager.exe` lalu klik tombol **Uninstall**. Add-in akan otomatis terhapus bersih dari sistem Anda.

<p align="center">
  <img src="assets/demo/demo-1.png" alt="Tutorial Uninstall" width="450">
</p>

---

## Panduan Instalasi (Word di Web)

1. Buka [Word di Web](https://word.office.com) dan buat dokumen kosong baru.
2. Pergi ke tab **Home** (Beranda) atau **Insert** (Sisipkan) pada pita menu.
3. Cari dan klik tombol **Add-ins**.
4. Pada dialog Office Add-ins, pilih **Upload My Add-in** (Unggah Add-in Saya).
5. Pilih file `manifest.xml` (bisa diunduh dari [GitHub](https://github.com/rey-workbench/ReySkripsi)) dan klik **Upload**.
6. Add-in akan muncul di tab Home atau sebagai panel tugas di sebelah kanan.

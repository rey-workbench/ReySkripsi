# ReySkripsi - Microsoft Word Add-in

ReySkripsi adalah Microsoft Word Add-in yang dirancang khusus untuk mempermudah proses merapikan dan memformat dokumen karya ilmiah atau skripsi. 

## 🚀 Fitur Utama
- **Deteksi Kata Asing:** Otomatis menandai atau mengubah kata asing/typo yang tidak ada di dalam Kamus Besar Bahasa Indonesia (KBBI).
- **Format Typografi:** Memperbaiki format tulisan secara instan.
- **Dukungan Penuh:** Bekerja mulus baik di Word untuk Web maupun Word Desktop (Windows/Mac).

---

## 📥 Panduan Instalasi (Word Local / Desktop)

Berikut adalah langkah-langkah untuk menginstal add-in ReySkripsi di komputer lokal Anda menggunakan metode **Shared Folder**:

### Langkah 1: Bagikan Folder Manifest
Buat folder baru di komputer Anda (misal: `C:\Addins`) dan letakkan file `manifest.xml` yang sudah diunduh ke dalamnya. Klik kanan folder tersebut > **Properties** > tab **Sharing** > **Share...** > Klik **Share**. Salin **Network Path**-nya (contoh: `\\NamaKomputer\Addins`).

### Langkah 2: Buka Pengaturan File
Buka Microsoft Word. Klik tab **File** di pojok kiri atas, kemudian pilih **Options** (Pengaturan) di bagian bawah kiri.

![Klik tab File](assets/tutorial-step-1-click-file.png)

![Klik menu Options](assets/tutorial-step-2-options.png)

### Langkah 3: Buka Trust Center
Pada jendela Word Options, klik **Trust Center** di menu sebelah kiri, lalu klik tombol **Trust Center Settings...** di sebelah kanan.

![Trust Center](assets/tutorial-step-3-trust-center.png)

![Trust Center Settings](assets/tutorial-step-4-trust-settings.png)

### Langkah 4: Tambahkan Trusted Catalog
Pilih **Trusted Add-in Catalogs** dari menu kiri. Masukkan **Network Path** yang sudah Anda salin tadi (**Bukan** link website/HTTPS) ke dalam kotak **Catalog Url**, lalu klik **Add catalog**. 
Setelah ditambahkan, pastikan kotak **Show in Menu** dicentang. Klik **OK** dan **muat ulang (restart)** Microsoft Word Anda.

![Trusted Add-in Catalogs](assets/tutorial-step-5-catalog.png)

### Langkah 5: Gunakan Add-in
Setelah Word terbuka kembali, buka dokumen kosong. Pergi ke tab **Home** (Beranda), klik ikon **Add-ins** (atau klik **File** > **Get Add-ins**). Pilih opsi **More Add-ins**, buka tab **SHARED FOLDER**, lalu klik pada add-in ReySkripsi untuk mengaktifkannya.

---

## 🌐 Panduan Instalasi (Word di Web)

1. Buka [Word di Web](https://word.office.com) dan buat dokumen kosong baru.
2. Pergi ke tab **Home** (Beranda) atau **Insert** (Sisipkan) pada pita menu.
3. Cari dan klik tombol **Add-ins**.
4. Pada dialog Office Add-ins, pilih **Upload My Add-in** (Unggah Add-in Saya).
5. Pilih file `manifest.xml` yang baru saja Anda unduh dan klik **Upload**.
6. Add-in akan muncul di tab Home atau sebagai panel tugas di sebelah kanan.

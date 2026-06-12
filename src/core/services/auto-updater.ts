import { ToastService } from './toast-service';

export class AutoUpdater {
    private currentVersion: string | null = null;
    private checkIntervalMs = 60 * 1000 * 5; // Cek setiap 5 menit

    public start() {
        // Ambil versi saat pertama kali load
        this.fetchVersion().then(version => {
            if (version) this.currentVersion = version;
            
            // Mulai polling
            setInterval(() => this.checkForUpdates(), this.checkIntervalMs);
            
            // Cek juga saat window kembali aktif (mendapat fokus)
            window.addEventListener('focus', () => this.checkForUpdates());
        });
    }

    private async fetchVersion(): Promise<string | null> {
        try {
            // Minta file version.json tanpa cache
            const res = await fetch(`version.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                return data.version;
            }
        } catch (e) {
            console.warn("Gagal mengecek pembaruan", e);
        }
        return null;
    }

    private async checkForUpdates() {
        if (!this.currentVersion) return; // Jika gagal inisialisasi awal, abaikan

        const newVersion = await this.fetchVersion();
        if (newVersion && newVersion !== this.currentVersion) {
            ToastService.show("Memperbarui Add-in ke versi terbaru...", true);
            
            // Beri waktu 2 detik agar pesan terbaca sebelum reload
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
}

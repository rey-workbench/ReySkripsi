import { ToastService } from '@/core/services/ui/toast-service';

export class AutoUpdater {
    private currentVersion: string | null = null;
    private checkIntervalMs = 5 * 60 * 1000; // Cek setiap 5 menit
    private timerId: number | null = null;
    private onFocus = () => this.checkForUpdates();

    public start() {
        // Ambil versi saat pertama kali load
        this.fetchVersion().then(version => {
            this.currentVersion = version;

            // Mulai polling — simpan id agar bisa di-clear
            this.timerId = window.setInterval(() => this.checkForUpdates(), this.checkIntervalMs);

            // Cek juga saat window kembali aktif (mendapat fokus)
            window.addEventListener('focus', this.onFocus);

            // Jika versi gagal dibaca saat pertama kali, coba lagi sebentar kemudian
            if (!version) {
                window.setTimeout(() => this.checkForUpdates(), 30000);
            }
        });
    }

    /**
     * Menghentikan polling dan listener fokus. Berguna untuk tes / saat add-in ditutup.
     */
    public stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        window.removeEventListener('focus', this.onFocus);
    }

    private async fetchVersion(): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`version.json?t=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                if (typeof data?.version === 'string') {
                    return data.version;
                }
            }
        } catch (err) {
            const error = err as { name?: string };
            if (error.name !== 'AbortError') {
                console.warn("Gagal mengecek pembaruan", err);
            }
        }
        return null;
    }

    private async checkForUpdates() {
        if (!this.currentVersion) return; // Jika gagal inisialisasi awal, abaikan

        const newVersion = await this.fetchVersion();
        if (newVersion && newVersion !== this.currentVersion) {
            ToastService.show("Memperbarui Add-in ke versi terbaru...", true);

            // Beri waktu 2 detik agar pesan terbaca sebelum reload
            window.setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
}

import { ToastService } from '@/core/services/ui/toast-service';
import { fetchWithTimeout } from '@/core/utils/fetch';

export class AutoUpdater {
    private currentVersion: string | null = null;
    private checkIntervalMs = 5 * 60 * 1000;
    private timerId: number | null = null;
    private lastCheckAt = 0;
    private onFocus = () => this.checkForUpdates();

    public start() {
        this.fetchVersion().then(version => {
            this.currentVersion = version;

            this.timerId = window.setInterval(() => this.checkForUpdates(), this.checkIntervalMs);
            window.addEventListener('focus', this.onFocus);

            if (!version) {
                window.setTimeout(() => this.checkForUpdates(), 30000);
            }
        });
    }

    public stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        window.removeEventListener('focus', this.onFocus);
    }

    private async fetchVersion(): Promise<string | null> {
        try {
            const res = await fetchWithTimeout(`version.json?t=${Date.now()}`, {}, 10000);
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
        const newVersion = await this.fetchVersion();
        if (!newVersion) return;
        if (this.currentVersion === null) {
            this.currentVersion = newVersion;
            return;
        }

        const now = Date.now();
        if (now - this.lastCheckAt < this.checkIntervalMs) return;

        if (newVersion !== this.currentVersion) {
            this.lastCheckAt = now;
            ToastService.show("Memperbarui Add-in ke versi terbaru...", true);
            window.setTimeout(() => window.location.reload(), 2000);
        }
    }
}

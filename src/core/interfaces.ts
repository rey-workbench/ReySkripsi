export interface IModule {
    id: string;
    name: string;
    iconClass: string;
    iconColor: string;
    htmlContent: string;

    // Dipanggil setelah HTML modul disuntikkan ke DOM.
    onInit(): void | Promise<void>;
}

export interface ICancellationToken {
    isCancelled: boolean;
}

export type TProgressCallback = (percent: number, message: string) => void;

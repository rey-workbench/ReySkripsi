export interface IModule {
    id: string;
    name: string;
    iconClass: string;
    iconColor: string;
    htmlContent: string;

    onInit(): void | Promise<void>;
}

export interface ICancellationToken {
    isCancelled: boolean;
}

export type TProgressCallback = (percent: number, message: string) => void;

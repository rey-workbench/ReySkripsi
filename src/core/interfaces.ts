export interface IModule {
    id: string;          // e.g. 'module-lang'
    name: string;        // e.g. 'Auto Language'
    iconClass: string;   // e.g. 'ms-Icon--LocaleLanguage'
    iconColor: string;   // e.g. '#0078D4'
    htmlContent: string; // The HTML string template
    
    // Lifecycle hook: called after HTML is injected into DOM
    onInit(): void;
}

export interface ICancellationToken {
    isCancelled: boolean;
}

export type TProgressCallback = (percent: number, message: string) => void;

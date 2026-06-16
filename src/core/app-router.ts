import { IModule } from './interfaces';
import { Card } from './components/card';
import { Layout } from './components/layout';

export class AppRouter {
    private modules: IModule[] = [];

    public register(module: IModule) {
        this.modules.push(module);
    }

    public start() {
        this.renderHomeScreen();
        this.renderModules();
    }

    private renderHomeScreen() {
        const appGrid = document.getElementById("app-grid");
        if (!appGrid) return;
        
        let gridHtml = "";
        this.modules.forEach(mod => {
            gridHtml += Card.render({
                id: mod.id, 
                title: mod.name, 
                icon: mod.iconClass, 
                iconColor: mod.iconColor
            });
        });
        
        appGrid.innerHTML = gridHtml;

        this.modules.forEach(mod => {
            const cardEl = document.querySelector(`[data-module="${mod.id}"]`);
            cardEl?.addEventListener("click", () => this.openModule(mod.id));
        });
    }

    private renderModules() {
        const container = document.getElementById("module-container");
        if (!container) return;

        container.innerHTML = '';
        this.modules.forEach(mod => {
            container.innerHTML += Layout.render({
                id: mod.id,
                title: mod.name,
                content: mod.htmlContent
            });
        });

        // Initialize modules after DOM injection so they can bind their events
        setTimeout(() => {
            this.modules.forEach(mod => {
                mod.onInit();
                
                // Bind the back button by finding the .btn-back class inside this module
                const moduleContainer = document.getElementById(mod.id);
                if (moduleContainer) {
                    const backBtn = moduleContainer.querySelector('[data-back-button="true"]');
                    if (backBtn) {
                        backBtn.addEventListener("click", () => this.goHome());
                    }
                }
            });
        }, 50);
    }

    public openModule(moduleId: string) {
        document.getElementById("home-screen")?.classList.remove("active");
        document.getElementById(moduleId)?.classList.add("active");
    }

    public goHome() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove("active"));
        document.getElementById("home-screen")?.classList.add("active");
    }
}

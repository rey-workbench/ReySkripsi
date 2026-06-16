import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { Textarea } from '../../core/components/textarea';
import { Dropdown } from '../../core/components/dropdown';
import { ToastService } from '../../core/services/toast-service';
import { GeminiService } from '../../core/services/gemini-service';

export class AiChatbotModule implements IModule {
    public id = "module-ai-chatbot";
    public name = "AI Chatbot";
    public iconClass = "ms-Icon--Robot";
    public iconColor = "#107c41";
    
    public get htmlContent(): string {
        return `
            <div class="module-header">
                <h3 class="ms-font-l" style="margin: 0; color: #111827;">Asisten AI (Gemini)</h3>
                <p class="ms-font-s" style="color: #6b7280; margin-top: 4px;">Tanya AI untuk membantu penulisan dokumen Anda.</p>
            </div>
            <div class="module-content" style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <label style="font-size: 13px; font-weight: 600; color: #242424;">Gemini API Key:</label>
                    <input type="password" id="ai-api-key" placeholder="Masukkan API Key" style="padding: 6px; border: 1px solid #e1dfdd; border-radius: 4px; font-size: 14px;" />
                </div>
                
                ${Dropdown.render({
                    id: 'ai-model-select',
                    label: 'Pilih Model Gemini:',
                    options: [
                        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
                        { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
                        { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 (Pro)' },
                        { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 (Lite)' }
                    ]
                })}

                <div id="ai-chat-history" style="height: 250px; overflow-y: auto; border: 1px solid #e1dfdd; padding: 8px; border-radius: 4px; background: #faf9f8; display: flex; flex-direction: column; gap: 8px;">
                    <div style="font-size: 12px; color: #6b7280; text-align: center;">Mulai percakapan dengan AI</div>
                </div>
                ${Textarea.render({
                    id: 'ai-chat-input',
                    label: 'Pesan Anda:',
                    placeholder: 'Tanyakan sesuatu...',
                    rows: 3
                })}
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${Button.render({
                        id: 'ai-btn-send',
                        text: 'Kirim Pesan',
                        variant: 'primary',
                        icon: 'ms-Icon--Send'
                    })}
                    ${Button.render({
                        id: 'ai-btn-ask-selected',
                        text: 'Tanya tentang teks terpilih',
                        variant: 'secondary',
                        icon: 'ms-Icon--TextDocument'
                    })}
                </div>
            </div>
        `;
    }

    public onInit(): void {
        const btnSend = document.getElementById("ai-btn-send");
        const btnAskSelected = document.getElementById("ai-btn-ask-selected");
        
        if (btnSend) btnSend.addEventListener("click", () => this.handleSend());
        if (btnAskSelected) btnAskSelected.addEventListener("click", () => this.handleAskSelected());
    }

    private addMessage(sender: 'User' | 'AI', text: string) {
        const historyContainer = document.getElementById("ai-chat-history");
        if (!historyContainer) return;
        
        const msgDiv = document.createElement("div");
        msgDiv.style.padding = "8px";
        msgDiv.style.borderRadius = "4px";
        msgDiv.style.fontSize = "14px";
        
        if (sender === 'User') {
            msgDiv.style.backgroundColor = "#e0f2fe";
            msgDiv.style.color = "#0369a1";
            msgDiv.style.alignSelf = "flex-end";
            msgDiv.style.maxWidth = "85%";
        } else {
            msgDiv.style.backgroundColor = "#dcfce7";
            msgDiv.style.color = "#15803d";
            msgDiv.style.alignSelf = "flex-start";
            msgDiv.style.maxWidth = "85%";
        }
        
        msgDiv.innerHTML = `<strong>${sender}:</strong> <br/>${text.replace(/\n/g, '<br/>')}`;
        historyContainer.appendChild(msgDiv);
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    private getApiKeyAndModel(): { apiKey: string, model: string } | null {
        const apiKeyEl = document.getElementById("ai-api-key") as HTMLInputElement;
        const modelEl = document.getElementById("ai-model-select") as HTMLSelectElement;
        
        if (!apiKeyEl || !apiKeyEl.value.trim()) {
            ToastService.show("Silakan masukkan Gemini API Key terlebih dahulu.", true);
            return null;
        }

        return {
            apiKey: apiKeyEl.value.trim(),
            model: modelEl ? modelEl.value : 'gemini-3.5-flash'
        };
    }

    private async handleSend() {
        const config = this.getApiKeyAndModel();
        if (!config) return;

        const inputEl = document.getElementById("ai-chat-input") as HTMLTextAreaElement;
        if (!inputEl) return;
        
        const message = inputEl.value.trim();
        if (!message) return;
        
        inputEl.value = "";
        this.addMessage('User', message);
        
        await this.fetchResponse(message, config.apiKey, config.model);
    }

    private async handleAskSelected() {
        const config = this.getApiKeyAndModel();
        if (!config) return;

        try {
            ToastService.showProgress("Mengambil teks terpilih...", 0);
            let selectedText = "";
            
            await Word.run(async (context) => {
                const range = context.document.getSelection();
                range.load("text");
                await context.sync();
                selectedText = range.text;
            });
            
            ToastService.hide();
            
            if (!selectedText.trim()) {
                ToastService.show("Pilih beberapa teks terlebih dahulu di dokumen Anda.", true);
                return;
            }

            const inputEl = document.getElementById("ai-chat-input") as HTMLTextAreaElement;
            const additionalPrompt = inputEl ? inputEl.value.trim() : "";
            const prompt = additionalPrompt 
                ? `${additionalPrompt}\n\nTeks:\n"${selectedText}"` 
                : `Tolong analisis atau jelaskan teks berikut:\n\n"${selectedText}"`;
            
            if (inputEl) inputEl.value = "";
            
            this.addMessage('User', prompt);
            await this.fetchResponse(prompt, config.apiKey, config.model);
            
        } catch (error: any) {
            ToastService.show("Error: " + error.message, true);
        }
    }

    private async fetchResponse(prompt: string, apiKey: string, model: string) {
        try {
            ToastService.showProgress("Menunggu respons AI...", 0);
            
            const historyContainer = document.getElementById("ai-chat-history");
            const loadingId = "loading-" + Date.now();
            if (historyContainer) {
                const msgDiv = document.createElement("div");
                msgDiv.id = loadingId;
                msgDiv.style.padding = "8px";
                msgDiv.style.fontSize = "14px";
                msgDiv.style.color = "#6b7280";
                msgDiv.innerHTML = `<em>AI (${model}) sedang mengetik...</em>`;
                historyContainer.appendChild(msgDiv);
                historyContainer.scrollTop = historyContainer.scrollHeight;
            }

            const response = await GeminiService.generateContent(prompt, apiKey, model);
            
            ToastService.hide();
            
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            this.addMessage('AI', response);
        } catch (error: any) {
            ToastService.hide();
            const loadingEl = document.getElementById("ai-chat-history")?.lastElementChild;
            if (loadingEl && loadingEl.innerHTML.includes("sedang mengetik")) {
                loadingEl.remove();
            }
            this.addMessage('AI', `Error: ${error.message}`);
        }
    }
}

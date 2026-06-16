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
                    label: 'Pesan / Instruksi Anda:',
                    placeholder: 'Tanyakan sesuatu atau berikan instruksi revisi...',
                    rows: 3
                })}
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${Button.render({
                        id: 'ai-btn-send',
                        text: 'Kirim Pesan',
                        variant: 'primary',
                        icon: 'ms-Icon--Send'
                    })}
                </div>
            </div>
        `;
    }

    public onInit(): void {
        const btnSend = document.getElementById("ai-btn-send");
        if (btnSend) btnSend.addEventListener("click", () => this.handleSend());
    }

    private addMessage(sender: 'User' | 'AI', text: string) {
        const historyContainer = document.getElementById("ai-chat-history");
        if (!historyContainer) return;
        
        const msgDiv = document.createElement("div");
        msgDiv.style.padding = "8px";
        msgDiv.style.borderRadius = "4px";
        msgDiv.style.fontSize = "14px";
        msgDiv.style.display = "flex";
        msgDiv.style.flexDirection = "column";
        msgDiv.style.gap = "4px";
        
        if (sender === 'User') {
            msgDiv.style.backgroundColor = "#e0f2fe";
            msgDiv.style.color = "#0369a1";
            msgDiv.style.alignSelf = "flex-end";
            msgDiv.style.maxWidth = "85%";
            msgDiv.innerHTML = `<strong>${sender}:</strong> <div>${this.formatMarkdown(text)}</div>`;
        } else {
            msgDiv.style.backgroundColor = "#dcfce7";
            msgDiv.style.color = "#15803d";
            msgDiv.style.alignSelf = "flex-start";
            msgDiv.style.maxWidth = "85%";
            msgDiv.innerHTML = `<strong>${sender}:</strong> <div>${this.formatMarkdown(text)}</div>`;
            
            // Add an action button to insert this AI response into the Word document
            const actionDiv = document.createElement("div");
            actionDiv.style.marginTop = "8px";
            actionDiv.style.textAlign = "right";
            
            const insertBtn = document.createElement("button");
            insertBtn.innerText = "Sisipkan / Ganti di Dokumen";
            insertBtn.style.fontSize = "11px";
            insertBtn.style.padding = "4px 8px";
            insertBtn.style.cursor = "pointer";
            insertBtn.style.border = "1px solid #16a34a";
            insertBtn.style.backgroundColor = "transparent";
            insertBtn.style.color = "#16a34a";
            insertBtn.style.borderRadius = "4px";
            
            insertBtn.addEventListener("click", () => this.insertToDocument(text));
            insertBtn.addEventListener("mouseover", () => {
                insertBtn.style.backgroundColor = "#16a34a";
                insertBtn.style.color = "#ffffff";
            });
            insertBtn.addEventListener("mouseout", () => {
                insertBtn.style.backgroundColor = "transparent";
                insertBtn.style.color = "#16a34a";
            });

            actionDiv.appendChild(insertBtn);
            msgDiv.appendChild(actionDiv);
        }
        
        historyContainer.appendChild(msgDiv);
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    private formatMarkdown(text: string): string {
        if (!text) return "";

        let html = text;
        
        // Escape HTML
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:#f3f2f1; color:#242424; padding:8px; border-radius:4px; overflow-x:auto; margin:4px 0;"><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f2f1; color:#242424; padding:2px 4px; border-radius:2px;">$1</code>');
        
        // Bold
        html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic (using _text_)
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Headings
        html = html.replace(/^### (.*$)/gim, '<h3 style="margin:12px 0 4px 0; font-size:14px; font-weight:bold; color:#111827;">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 style="margin:14px 0 4px 0; font-size:15px; font-weight:bold; color:#111827;">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 style="margin:16px 0 4px 0; font-size:16px; font-weight:bold; color:#111827;">$1</h1>');
        
        // Lists (unordered)
        html = html.replace(/^\s*[\*\-] (.*$)/gim, '<li style="margin-left:20px; margin-bottom:2px;">$1</li>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br/>');
        
        // Clean up redundant breaks after block elements
        html = html.replace(/<\/h1><br\/>/g, '</h1>');
        html = html.replace(/<\/h2><br\/>/g, '</h2>');
        html = html.replace(/<\/h3><br\/>/g, '</h3>');
        html = html.replace(/<\/li><br\/>/g, '</li>');
        html = html.replace(/<\/pre><br\/>/g, '</pre>');

        return html;
    }

    private async insertToDocument(text: string) {
        try {
            await Word.run(async (context) => {
                const range = context.document.getSelection();
                // Replace selected text or insert at cursor
                range.insertText(text, Word.InsertLocation.replace);
                await context.sync();
            });
            ToastService.show("Teks berhasil disisipkan ke dokumen.", false);
        } catch (error: any) {
            ToastService.show("Gagal menyisipkan teks: " + error.message, true);
        }
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
        const userPrompt = message || "Tolong analisis, berikan feedback, dan revisi (jika diperlukan) tulisan ini.";
        
        if (inputEl) inputEl.value = "";
        
        try {
            ToastService.showProgress("Membaca konteks dokumen...", 0);
            let contextText = "";
            let contextType = "Dokumen Keseluruhan";
            
            await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load("text");
                await context.sync();
                
                if (selection.text && selection.text.trim()) {
                    contextText = selection.text;
                    contextType = "Teks Terpilih";
                } else {
                    const body = context.document.body;
                    body.load("text");
                    await context.sync();
                    contextText = body.text;
                    contextType = "Dokumen Keseluruhan";
                }
            });
            
            ToastService.hide();
            
            if (!contextText.trim()) {
                if (message) {
                    this.addMessage('User', message);
                    await this.fetchResponse(message, config.apiKey, config.model);
                    return;
                } else {
                    ToastService.show("Dokumen kosong dan tidak ada pesan yang diketik.", true);
                    return;
                }
            }

            const prompt = `${userPrompt}\n\nKonteks (${contextType}):\n"${contextText}"`;
            const displayMessage = message ? message : `[Meminta AI memproses ${contextType.toLowerCase()}]`;
            
            this.addMessage('User', displayMessage);
            await this.fetchResponse(prompt, config.apiKey, config.model);
            
        } catch (error: any) {
            ToastService.show("Error: " + error.message, true);
        }
    }

    private async fetchResponse(prompt: string, apiKey: string, model: string, systemInstruction?: string) {
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

            const response = await GeminiService.generateContent(prompt, apiKey, model, systemInstruction);
            
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

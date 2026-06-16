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
                <h3 class="ms-font-l" style="margin: 0; color: #111827;">Asisten AI</h3>
                <p class="ms-font-s" style="color: #6b7280; margin-top: 4px;">Powered by Gemini</p>
            </div>
            
            <div class="module-content">
                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                    <div>
                        <label style="font-size: 13px; font-weight: 600; color: #374151;">Gemini API Key</label>
                        <input type="password" id="ai-api-key" placeholder="Masukkan API Key Anda..." style="width: 100%; box-sizing: border-box; margin-top: 4px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px;" />
                    </div>
                    
                    <div>
                        ${Dropdown.render({
                            id: 'ai-model-select',
                            label: 'Model AI:',
                            options: [
                                { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
                                { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
                                { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 (Pro)' },
                                { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 (Lite)' },
                                { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                                { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                                { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }
                            ]
                        })}
                    </div>

                    <div id="ai-chat-history" style="height: 320px; overflow-y: auto; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb; display: flex; flex-direction: column; gap: 12px;">
                        <div id="ai-chat-empty" style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
                            Mulai percakapan dengan AI. Pesan Anda akan direspons otomatis berdasarkan isi dokumen.
                        </div>
                    </div>
                    
                    <div>
                        ${Textarea.render({
                            id: 'ai-chat-input',
                            label: '',
                            placeholder: 'Ketik pesan atau instruksi...',
                            rows: 2
                        })}
                    </div>
                    
                    <div>
                        ${Button.render({
                            id: 'ai-btn-send',
                            text: 'Kirim Pesan',
                            variant: 'primary'
                        })}
                    </div>
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
        
        const emptyState = document.getElementById("ai-chat-empty");
        if (emptyState) emptyState.style.display = "none";
        
        const msgWrapper = document.createElement("div");
        msgWrapper.style.display = "flex";
        msgWrapper.style.flexDirection = "column";
        msgWrapper.style.gap = "4px";
        
        const senderLabel = document.createElement("div");
        senderLabel.style.fontWeight = "600";
        senderLabel.style.fontSize = "12px";
        senderLabel.style.color = sender === 'User' ? "#0078D4" : "#107c41";
        senderLabel.innerText = sender === 'User' ? "Anda" : "AI";
        
        const msgDiv = document.createElement("div");
        msgDiv.style.fontSize = "13px";
        msgDiv.style.lineHeight = "1.5";
        msgDiv.style.color = "#333";
        msgDiv.style.background = sender === 'User' ? "#f3f2f1" : "white";
        msgDiv.style.border = sender === 'User' ? "none" : "1px solid #e2e8f0";
        msgDiv.style.padding = "8px 12px";
        msgDiv.style.borderRadius = "4px";
        
        if (sender === 'User') {
            msgDiv.innerHTML = text.replace(/\n/g, "<br/>");
        } else {
            msgDiv.innerHTML = this.formatMarkdown(text);
            
            // Add an action button to insert this AI response into the Word document
            const actionDiv = document.createElement("div");
            actionDiv.style.marginTop = "12px";
            actionDiv.style.display = "flex";
            actionDiv.style.justifyContent = "flex-end";
            
            const insertBtn = document.createElement("button");
            insertBtn.innerHTML = "<i class='ms-Icon ms-Icon--Insert' style='margin-right:4px;'></i> Sisipkan / Ganti di Dokumen";
            insertBtn.style.fontSize = "12px";
            insertBtn.style.fontWeight = "600";
            insertBtn.style.padding = "8px 14px";
            insertBtn.style.cursor = "pointer";
            insertBtn.style.border = "1px solid #107c41";
            insertBtn.style.backgroundColor = "transparent";
            insertBtn.style.color = "#107c41";
            insertBtn.style.borderRadius = "20px";
            insertBtn.style.transition = "all 0.2s";
            
            insertBtn.addEventListener("click", () => this.insertToDocument(text));
            insertBtn.addEventListener("mouseover", () => {
                insertBtn.style.backgroundColor = "#107c41";
                insertBtn.style.color = "#ffffff";
                insertBtn.style.boxShadow = "0 4px 10px rgba(16,124,65,0.2)";
            });
            insertBtn.addEventListener("mouseout", () => {
                insertBtn.style.backgroundColor = "transparent";
                insertBtn.style.color = "#107c41";
                insertBtn.style.boxShadow = "none";
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

            // Gunakan konteks dokumen sebagai System Prompt (System Instruction)
            const systemPrompt = `Anda adalah asisten AI cerdas untuk penulisan Microsoft Word. Berikut adalah isi ${contextType.toLowerCase()} yang sedang dikerjakan pengguna. Jadikan ini sebagai konteks dasar Anda untuk menjawab setiap permintaan pengguna. Jangan berikan ringkasan kecuali diminta.\n\nKonteks:\n"""\n${contextText}\n"""`;
            
            // Pesan dari user
            const finalUserPrompt = message || "Tolong analisis teks di atas dan berikan saran perbaikan.";
            
            this.addMessage('User', finalUserPrompt);
            await this.fetchResponse(finalUserPrompt, config.apiKey, config.model, systemPrompt);
            
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

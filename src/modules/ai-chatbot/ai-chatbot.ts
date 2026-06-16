import { IModule } from '../../core/interfaces';
import { ToastService } from '../../core/services/ui/toast-service';
import { AiOrchestrator } from '../../core/services/ai/ai-orchestrator';

export class AiChatbotModule implements IModule {
    public id = "module-ai-chatbot";
    public name = "Ask AI";
    public iconClass = "ms-Icon--Robot";
    public iconColor = "#107c41";
    
    public get htmlContent(): string {
        return `
            <div class="module-header" style="display: flex; align-items: center;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px; flex-shrink: 0;">
                    <defs>
                        <linearGradient id="ai-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#8b5cf6"/>
                            <stop offset="50%" stop-color="#3b82f6"/>
                            <stop offset="100%" stop-color="#0ea5e9"/>
                        </linearGradient>
                    </defs>
                    <path d="M11.5 0C11.5 5.5 16.5 10.5 22 10.5C16.5 10.5 11.5 15.5 11.5 21C11.5 15.5 6.5 10.5 1 10.5C6.5 10.5 11.5 5.5 11.5 0Z" fill="url(#ai-star-grad)"/>
                </svg>
                <div>
                    <h3 class="ms-font-l" style="margin: 0; color: #111827;">Ask AI</h3>
                    <p class="ms-font-s" style="color: #6b7280; margin-top: 4px;">Powered by Gemini</p>
                </div>
            </div>
            
            <div class="module-content" style="display: flex; flex-direction: column; height: calc(100vh - 120px);">
                <div style="margin-bottom: 16px;">
                    <label class="ms-fontWeight-semibold" style="display: block; margin-bottom: 4px; font-size: 13px; color: #111827;">Kunci API (API Key)</label>
                    <input type="password" id="ai-api-key" class="ms-TextField-field" placeholder="Masukkan Gemini API Key..." style="width: 100%; box-sizing: border-box; padding: 6px 12px; border-radius: 4px; border: 1px solid #d1d5db; font-size: 13px; margin-bottom: 8px;" />
                    <input type="password" id="nvidia-api-key" class="ms-TextField-field" placeholder="Masukkan NVIDIA API Key..." style="width: 100%; box-sizing: border-box; padding: 6px 12px; border-radius: 4px; border: 1px solid #d1d5db; font-size: 13px;" />
                </div>

                <div id="ai-chat-history" style="flex: 1; overflow-y: auto; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
                    <div id="ai-chat-empty" style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
                        Mulai percakapan dengan AI. Pesan Anda akan direspons otomatis berdasarkan isi dokumen.
                    </div>
                </div>
                
                <div style="position: relative; display: flex; align-items: center; background: #f3f2f1; border-radius: 24px; padding: 6px 16px; border: 1px solid #e2e8f0;">
                    <div id="ai-plus-btn" style="display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 4px; margin-right: 8px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='transparent'">
                        <i class="ms-Icon ms-Icon--Add" style="font-size: 16px; color: #6b7280;"></i>
                    </div>
                    
                    <!-- Popup Menu -->
                    <div id="ai-plus-menu" style="display: none; position: absolute; bottom: 100%; left: 0; margin-bottom: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 8px; min-width: 220px; z-index: 100;">
                        <div class="ai-menu-item" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--Document" style="font-size: 16px; color: #6b7280;"></i>
                            Gunakan Seluruh Dokumen
                        </div>
                        <div class="ai-menu-item" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--TextDocument" style="font-size: 16px; color: #6b7280;"></i>
                            Fokus Teks Terpilih
                        </div>
                        <div style="height: 1px; background: #e2e8f0; margin: 6px 0;"></div>
                        <div class="ai-menu-item" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--Search" style="font-size: 16px; color: #6b7280;"></i>
                            Pencarian Web (Search Grounding)
                        </div>
                        <div class="ai-menu-item" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--Lightbulb" style="font-size: 16px; color: #6b7280;"></i>
                            Mode Berpikir (Thinking)
                        </div>
                        <div class="ai-menu-item" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--Code" style="font-size: 16px; color: #6b7280;"></i>
                            Eksekusi Kode (Code Execution)
                        </div>
                    </div>
                    
                    <!-- Skill Badge -->
                    <div id="ai-skill-badge" style="display: none; align-items: center; background: #e0f2fe; color: #0369a1; font-size: 12px; padding: 4px 8px; border-radius: 12px; margin-right: 8px; font-weight: 600; gap: 4px;">
                        <span id="ai-skill-text"></span>
                        <i class="ms-Icon ms-Icon--Cancel" id="ai-skill-clear" style="cursor: pointer; font-size: 10px; margin-left: 4px;" title="Hapus"></i>
                    </div>
                    <!-- Hidden input to store skill context -->
                    <input type="hidden" id="ai-skill-value" value="" />
                    
                    <input type="text" id="ai-chat-input" placeholder="Minta Gemini..." style="flex: 1; background: transparent; border: none; outline: none; font-size: 14px; padding: 8px 0; color: #111827;" />
                    
                    <!-- Custom Dropdown Trigger -->
                    <div id="ai-model-trigger" style="display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 16px; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='transparent'">
                        <span id="ai-model-display" style="font-size: 13px; color: #374151; font-weight: 600; margin-right: 4px;">Flash 3.5</span>
                        <i class="ms-Icon ms-Icon--ChevronDown" style="font-size: 10px; color: #374151;"></i>
                    </div>
                    
                    <!-- Custom Dropdown Menu -->
                    <div id="ai-model-menu" style="display: none; position: absolute; bottom: 100%; right: 40px; margin-bottom: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 4px 0; min-width: 120px; z-index: 100;">
                        <div class="ai-model-item" data-value="gemini-3.5-flash" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">Gemini Flash 3.5</div>
                        <div class="ai-model-item" data-value="gemini-3-flash-preview" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">Gemini Flash 3</div>
                        <div class="ai-model-item" data-value="gemini-2.5-pro" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">Gemini Pro 2.5</div>
                        <div class="ai-model-item" data-value="gemini-2.5-flash" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">Gemini Flash 2.5</div>
                        <div style="height: 1px; background: #e2e8f0; margin: 4px 0;"></div>
                        <div class="ai-model-item" data-value="minimax-m3" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">Minimax-M3 (NVIDIA)</div>
                    </div>
                    <!-- Hidden input to store selected model -->
                    <input type="hidden" id="ai-model-select" value="gemini-3.5-flash" />

                    <button id="ai-btn-send" style="background: #107c41; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; color: white; transition: background 0.2s; margin-left: 8px;" onmouseover="this.style.background='#0c5e31'" onmouseout="this.style.background='#107c41'">
                        <i class="ms-Icon ms-Icon--Send" style="font-size: 14px; margin-left: 2px;"></i>
                    </button>
                </div>
            </div>
        `;
    }

    public onInit(): void {
        const btnSend = document.getElementById("ai-btn-send");
        const inputField = document.getElementById("ai-chat-input");
        const plusBtn = document.getElementById("ai-plus-btn");
        const plusMenu = document.getElementById("ai-plus-menu");
        const skillBadge = document.getElementById("ai-skill-badge");
        const skillText = document.getElementById("ai-skill-text");
        const skillClear = document.getElementById("ai-skill-clear");
        const skillValue = document.getElementById("ai-skill-value") as HTMLInputElement;
        
        const modelTrigger = document.getElementById("ai-model-trigger");
        const modelMenu = document.getElementById("ai-model-menu");
        const modelDisplay = document.getElementById("ai-model-display");
        const modelSelect = document.getElementById("ai-model-select") as HTMLInputElement;
        
        if (btnSend) btnSend.addEventListener("click", () => this.handleSend());
        if (inputField) {
            inputField.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
        
        // Custom Model Dropdown Logic
        if (modelTrigger && modelMenu) {
            modelTrigger.addEventListener("click", (e) => {
                e.stopPropagation();
                modelMenu.style.display = modelMenu.style.display === "none" ? "block" : "none";
                if (plusMenu) plusMenu.style.display = "none";
            });
            
            const modelItems = modelMenu.querySelectorAll('.ai-model-item');
            modelItems.forEach(item => {
                item.addEventListener('mouseover', () => (item as HTMLElement).style.background = '#f3f2f1');
                item.addEventListener('mouseout', () => (item as HTMLElement).style.background = 'transparent');
                
                item.addEventListener('click', (e) => {
                    const el = e.target as HTMLElement;
                    if (modelDisplay && modelSelect) {
                        modelDisplay.innerText = el.innerText;
                        modelSelect.value = el.getAttribute('data-value') || 'gemini-3.5-flash';
                    }
                    modelMenu.style.display = "none";
                });
            });
        }
        
        // Plus Menu Logic
        if (plusBtn && plusMenu) {
            plusBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                plusMenu.style.display = plusMenu.style.display === "none" ? "block" : "none";
                if (modelMenu) modelMenu.style.display = "none";
            });
            
            // Handle menu item clicks to set skill badge
            const menuItems = plusMenu.querySelectorAll('.ai-menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const text = (e.target as HTMLElement).innerText.trim();
                    if (skillBadge && skillText && skillValue) {
                        skillText.innerText = text;
                        skillValue.value = text;
                        skillBadge.style.display = "flex";
                    }
                    plusMenu.style.display = "none";
                    if (inputField) inputField.focus();
                });
            });
        }
        
        // Clear skill logic
        if (skillClear && skillBadge && skillValue) {
            skillClear.addEventListener("click", (e) => {
                e.stopPropagation();
                skillBadge.style.display = "none";
                skillValue.value = "";
            });
        }
        
        // Hide menus when clicking outside
        document.addEventListener("click", () => {
            if (plusMenu) plusMenu.style.display = "none";
            if (modelMenu) modelMenu.style.display = "none";
        });
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
        
        msgWrapper.appendChild(senderLabel);
        msgWrapper.appendChild(msgDiv);
        historyContainer.appendChild(msgWrapper);
        historyContainer.scrollTop = historyContainer.scrollHeight;
    }

    private formatMarkdown(text: string): string {
        if (!text) return "";

        let html = text.replace(/\r\n/g, '\n');
        
        // Escape HTML
        html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:#f3f2f1; color:#242424; padding:8px; border-radius:4px; overflow-x:auto; margin:4px 0;"><code>$1</code></pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f2f1; color:#242424; padding:2px 4px; border-radius:2px;">$1</code>');
        
        // Horizontal Rules
        html = html.replace(/^\s*(?:---+|\*\*\*+|___+)\s*$/gm, '<hr style="border:0; border-top:1px solid #e2e8f0; margin:16px 0;" />');
        
        // Tables
        html = html.replace(/(?:^\s*\|.*\|\s*$\n?)+/gm, (match) => {
            const rows = match.trim().split('\n');
            let tableHtml = '<div style="overflow-x:auto; margin:12px 0;"><table style="width:100%; border-collapse:collapse; font-size:12px;">';
            rows.forEach((row, i) => {
                // Skip the markdown separator row (e.g. |---|---|)
                if (row.indexOf('---') !== -1 && row.indexOf('|') !== -1) return;
                
                const cells = row.split('|');
                if (cells[0].trim() === '') cells.shift();
                if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();
                
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    // Check if there's markdown bold inside table cells
                    let cellContent = cell.trim();
                    cellContent = cellContent.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
                    cellContent = cellContent.replace(/_([^_]+)_/g, '<em>$1</em>');
                    
                    if (i === 0) {
                        tableHtml += `<th style="border:1px solid #e2e8f0; padding:6px 8px; background:#f8f9fa; text-align:left;">${cellContent}</th>`;
                    } else {
                        tableHtml += `<td style="border:1px solid #e2e8f0; padding:6px 8px;">${cellContent}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });
            tableHtml += '</table></div>';
            return tableHtml;
        });

        // Bold
        html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic (using _text_ or *text*)
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        
        // Headings
        html = html.replace(/^### (.*$)/gm, '<h3 style="margin:12px 0 4px 0; font-size:14px; font-weight:bold; color:#111827;">$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2 style="margin:14px 0 4px 0; font-size:15px; font-weight:bold; color:#111827;">$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1 style="margin:16px 0 4px 0; font-size:16px; font-weight:bold; color:#111827;">$1</h1>');
        
        // Lists (unordered)
        html = html.replace(/^\s*[\*\-] (.*$)/gm, '<li style="margin-left:20px; margin-bottom:4px; list-style-type:disc;">$1</li>');
        
        // Lists (ordered)
        html = html.replace(/^\s*\d+\.\s+(.*$)/gm, '<li style="margin-left:20px; margin-bottom:4px; list-style-type:decimal;">$1</li>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br/>');
        
        // Clean up redundant breaks after block elements
        html = html.replace(/<\/h1><br\/>/g, '</h1>');
        html = html.replace(/<\/h2><br\/>/g, '</h2>');
        html = html.replace(/<\/h3><br\/>/g, '</h3>');
        html = html.replace(/<\/li><br\/>/g, '</li>');
        html = html.replace(/<\/pre><br\/>/g, '</pre>');
        html = html.replace(/<\/div><br\/>/g, '</div>');
        html = html.replace(/<hr style="border:0; border-top:1px solid #e2e8f0; margin:16px 0;" \/><br\/>/g, '<hr style="border:0; border-top:1px solid #e2e8f0; margin:16px 0;" />');

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
        const geminiKeyEl = document.getElementById("ai-api-key") as HTMLInputElement;
        const nvidiaKeyEl = document.getElementById("nvidia-api-key") as HTMLInputElement;
        const modelEl = document.getElementById("ai-model-select") as HTMLInputElement;
        
        const selectedModel = modelEl ? modelEl.value : 'gemini-3.5-flash';
        const isNvidia = selectedModel.includes('minimax');
        
        let apiKey = '';
        if (isNvidia) {
            if (!nvidiaKeyEl || !nvidiaKeyEl.value.trim()) {
                ToastService.show("Silakan masukkan NVIDIA API Key terlebih dahulu.", true);
                return null;
            }
            apiKey = nvidiaKeyEl.value.trim();
        } else {
            if (!geminiKeyEl || !geminiKeyEl.value.trim()) {
                ToastService.show("Silakan masukkan Gemini API Key terlebih dahulu.", true);
                return null;
            }
            apiKey = geminiKeyEl.value.trim();
        }

        return {
            apiKey: apiKey,
            model: selectedModel
        };
    }

    private async handleSend() {
        const config = this.getApiKeyAndModel();
        if (!config) return;

        const inputEl = document.getElementById("ai-chat-input") as HTMLInputElement;
        const skillValueEl = document.getElementById("ai-skill-value") as HTMLInputElement;
        if (!inputEl) return;
        
        const rawMessage = inputEl.value.trim();
        const skillContext = skillValueEl && skillValueEl.value ? `[Konteks Skill: ${skillValueEl.value}] ` : "";
        const finalMessage = skillContext + rawMessage;
        
        const userPrompt = finalMessage || "Tolong analisis, berikan feedback, dan revisi (jika diperlukan) tulisan ini.";
        
        if (inputEl) inputEl.value = "";
        
        try {
            ToastService.showProgress("Membaca konteks dokumen...", 0);
            
            // Tampilkan chat pengguna (hanya rawMessage yang ditampilkan ke UI agar bersih, atau tampilkan dengan tag skill)
            const displayMessage = skillValueEl && skillValueEl.value 
                ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px;">${skillValueEl.value}</span> ${rawMessage}` 
                : rawMessage || "Tolong analisis teks...";
                
            this.addMessage('User', displayMessage);
            let contextText = "";
            let contextType = "Dokumen Keseluruhan";
            
            await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load("text");
                await context.sync();
                
                if (skillValueEl && skillValueEl.value === "Fokus Teks Terpilih" && selection.text && selection.text.trim()) {
                    contextText = selection.text;
                    contextType = "Teks Terpilih";
                } else if (skillValueEl && skillValueEl.value === "Gunakan Seluruh Dokumen") {
                    const body = context.document.body;
                    body.load("text");
                    await context.sync();
                    contextText = body.text;
                    contextType = "Dokumen Keseluruhan";
                } else {
                    // Default behavior if no specific skill badge
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
                }
            });
            
            ToastService.hide();
            
            if (!contextText.trim()) {
                if (rawMessage) {
                    await this.fetchResponse(userPrompt, config.apiKey, config.model);
                    return;
                } else {
                    ToastService.show("Dokumen kosong dan tidak ada pesan yang diketik.", true);
                    return;
                }
            }

            // Gunakan konteks dokumen sebagai System Prompt (System Instruction)
            const systemPrompt = `Anda adalah asisten AI cerdas untuk penulisan Microsoft Word. Berikut adalah isi ${contextType.toLowerCase()} yang sedang dikerjakan pengguna. Jadikan ini sebagai konteks dasar Anda untuk menjawab setiap permintaan pengguna. Jangan berikan ringkasan kecuali diminta.\n\nKonteks:\n"""\n${contextText}\n"""`;
            
            await this.fetchResponse(userPrompt, config.apiKey, config.model, systemPrompt);
            
        } catch (error: any) {
            ToastService.show("Error: " + error.message, true);
        }
    }

    private async fetchResponse(prompt: string, apiKey: string, model: string, systemInstruction?: string) {
        const loadingId = "loading-" + Date.now();
        try {
            ToastService.showProgress("Menunggu respons AI...", 0);
            
            const historyContainer = document.getElementById("ai-chat-history");
            
            if (historyContainer) {
                historyContainer.innerHTML += `
                    <div id="${loadingId}" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-weight: 600; font-size: 12px; color: #107c41;">AI</div>
                        <div style="font-size: 13px; color: #666; font-style: italic;">Sedang mengetik...</div>
                    </div>
                `;
                historyContainer.scrollTop = historyContainer.scrollHeight;
            }

            const aiResponse = await AiOrchestrator.generateResponse(prompt, apiKey, model, systemInstruction);
            
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) {
                loadingEl.remove();
            }
            ToastService.hide();
            this.addMessage('AI', aiResponse);
        } catch (error: any) {
            ToastService.hide();
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            this.addMessage('AI', `Error: ${error.message}`);
        }
    }
}

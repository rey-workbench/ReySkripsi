import { IModule } from '@/core/interfaces';
import { ToastService } from '@/core/services/ui/toast-service';
import { AiOrchestrator } from '@/core/services/ai/ai-orchestrator';
import { StorageService } from '@/core/services/storage/storage-service';
import { AiModel, AI_MODEL_LIST, DEFAULT_AI_MODEL } from '@/core/services/ai/ai-models';

export class AiChatbotModule implements IModule {
    public id = "module-ai-chatbot";
    public name = "Ask AI";
    public iconClass = "ms-Icon--Robot";
    public iconColor = "#107c41";
    
    public get htmlContent(): string {
        const modelItemsHtml = AI_MODEL_LIST.map((m) => {
            const separator = m.isNvidia ? '<div style="height: 1px; background: #e2e8f0; margin: 4px 0;"></div>' : '';
            return `
                ${separator}
                <div class="ai-model-item" data-value="${m.value}" style="padding: 8px 16px; font-size: 13px; cursor: pointer; color: #374151;">
                    ${m.label}
                </div>
            `;
        }).join('');

        return `
            <div class="module-header" style="display: flex; align-items: center; margin-bottom: 24px;">
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
                </div>
            </div>
            
            <div class="module-content" style="display: flex; flex-direction: column; height: calc(100vh - 120px);">
                <div id="ai-chat-history" style="flex: 1; overflow-y: auto; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px;">
                    <div id="ai-chat-empty" style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 20px;">
                        Mulai percakapan dengan AI. Pesan Anda akan direspons otomatis berdasarkan isi dokumen.
                    </div>
                </div>
                
                <div style="position: relative; display: flex; flex-direction: column; background: #f3f2f1; border-radius: 16px; padding: 8px 12px; border: 1px solid #e2e8f0; gap: 8px;">
                    
                    <div style="display: flex; align-items: center; width: 100%;">
                        <div id="ai-plus-btn" style="display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 4px; margin-right: 8px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='transparent'">
                            <i class="ms-Icon ms-Icon--Add" style="font-size: 16px; color: #6b7280;"></i>
                        </div>
                        
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
                        
                        <div id="ai-skill-badge" style="display: none; align-items: center; background: #e0f2fe; color: #0369a1; font-size: 12px; padding: 4px 8px; border-radius: 12px; margin-right: 8px; font-weight: 600; gap: 4px;">
                            <span id="ai-skill-text"></span>
                            <i class="ms-Icon ms-Icon--Cancel" id="ai-skill-clear" style="cursor: pointer; font-size: 10px; margin-left: 4px;" title="Hapus"></i>
                        </div>
                        <input type="hidden" id="ai-skill-value" value="" />
                        
                        <input type="text" id="ai-chat-input" placeholder="Minta AI..." style="flex: 1; background: transparent; border: none; outline: none; font-size: 14px; padding: 4px 0; color: #111827; min-width: 0;" />
                    </div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-left: 4px;">
                        
                        <div id="ai-model-trigger" style="display: flex; align-items: center; cursor: pointer; padding: 4px 8px; border-radius: 16px; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='transparent'">
                            <span id="ai-model-display" style="font-size: 12px; color: #6b7280; font-weight: 600; margin-right: 4px;"></span>
                            <i class="ms-Icon ms-Icon--ChevronDown" style="font-size: 10px; color: #6b7280;"></i>
                        </div>
                        
                        <div id="ai-model-menu" style="display: none; position: absolute; bottom: 100%; left: 12px; margin-bottom: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 4px 0; min-width: 220px; z-index: 100; max-height: 250px; overflow-y: auto;">
                            ${modelItemsHtml}
                        </div>
                        <input type="hidden" id="ai-model-select" value="${DEFAULT_AI_MODEL}" />
    
                        <button id="ai-btn-send" style="background: #0078D4; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; color: white; transition: background 0.2s; box-shadow: 0 2px 4px rgba(0,120,212,0.2);" onmouseover="this.style.background='#005a9e'" onmouseout="this.style.background='#0078D4'">
                            <i class="ms-Icon ms-Icon--Send" style="font-size: 14px; margin-left: 2px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    private isGenerating = false;

    public onInit(): void {
        const btnSend = document.getElementById("ai-btn-send");
        const inputField = document.getElementById("ai-chat-input") as HTMLInputElement;
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

        // Tampilkan label model default dari AI_MODEL_LIST agar tidak hardcoded.
        if (modelDisplay) {
            const defaultModel = AI_MODEL_LIST.find(m => m.value === DEFAULT_AI_MODEL);
            modelDisplay.innerText = defaultModel ? defaultModel.label : DEFAULT_AI_MODEL;
        }
        
        if (btnSend) btnSend.addEventListener("click", () => this.handleSend());
        if (inputField) {
            inputField.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }
        
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
                        modelSelect.value = el.getAttribute('data-value') || DEFAULT_AI_MODEL;
                    }
                    modelMenu.style.display = "none";
                });
            });
        }
        
        if (plusBtn && plusMenu) {
            plusBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                plusMenu.style.display = plusMenu.style.display === "none" ? "block" : "none";
                if (modelMenu) modelMenu.style.display = "none";
            });
            
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
        
        if (skillClear && skillBadge && skillValue) {
            skillClear.addEventListener("click", (e) => {
                e.stopPropagation();
                skillBadge.style.display = "none";
                skillValue.value = "";
            });
        }
        
        document.addEventListener("click", () => {
            if (plusMenu) plusMenu.style.display = "none";
            if (modelMenu) modelMenu.style.display = "none";
        });

        const historyContainer = document.getElementById("ai-chat-history");
        if (historyContainer) {
            historyContainer.addEventListener("click", (e) => {
                const target = e.target as HTMLElement;
                const citationEl = target.closest(".ai-citation") as HTMLElement;
                if (citationEl) {
                    const searchText = citationEl.getAttribute("data-search");
                    if (searchText) {
                        this.jumpToText(searchText);
                    }
                }
            });
        }
    }

    private async jumpToText(searchText: string) {
        try {
            await Word.run(async (context) => {
                const cleanSearchText = searchText.replace(/^["']|["']$/g, '').trim();
                const searchResults = context.document.body.search(cleanSearchText.substring(0, 100), {
                    matchCase: false,
                    matchWholeWord: false
                });

                searchResults.load("items");
                await context.sync();

                if (searchResults.items.length > 0) {
                    let targetItem = searchResults.items[0];
                    if (searchResults.items.length > 1) {
                        targetItem = searchResults.items[searchResults.items.length - 1];
                    }
                    
                    targetItem.select();
                    await context.sync();
                    ToastService.show("Teks referensi ditemukan.", false);
                } else {
                    ToastService.show("Teks referensi tidak ditemukan di dokumen saat ini.", true);
                }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            ToastService.show("Gagal mencari referensi: " + message, true);
        }
    }

    private toggleLoadingState(isLoading: boolean) {
        this.isGenerating = isLoading;
        const btnSend = document.getElementById("ai-btn-send");
        const inputField = document.getElementById("ai-chat-input") as HTMLInputElement;
        
        if (btnSend) {
            if (isLoading) {
                btnSend.style.opacity = "0.5";
                btnSend.style.cursor = "not-allowed";
                btnSend.style.pointerEvents = "none";
            } else {
                btnSend.style.opacity = "1";
                btnSend.style.cursor = "pointer";
                btnSend.style.pointerEvents = "auto";
            }
        }

        if (inputField) {
            inputField.disabled = isLoading;
        }
    }

    private appendMessage(sender: "user" | "ai", text: string, citations: string[] = []): HTMLElement {
        const history = document.getElementById("ai-chat-history");
        const emptyState = document.getElementById("ai-chat-empty");

        if (emptyState) {
            emptyState.style.display = "none";
        }

        const messageEl = document.createElement("div");
        messageEl.style.display = "flex";
        messageEl.style.flexDirection = "column";
        messageEl.style.maxWidth = "85%";
        messageEl.style.padding = "10px 14px";
        messageEl.style.borderRadius = "12px";
        messageEl.style.fontSize = "13px";
        messageEl.style.lineHeight = "1.5";
        messageEl.style.wordBreak = "break-word";

        if (sender === "user") {
            messageEl.style.alignSelf = "flex-end";
            messageEl.style.background = "#0078D4";
            messageEl.style.color = "#ffffff";
            messageEl.style.borderBottomRightRadius = "2px";
        } else {
            messageEl.style.alignSelf = "flex-start";
            messageEl.style.background = "#f3f2f1";
            messageEl.style.color = "#111827";
            messageEl.style.borderBottomLeftRadius = "2px";
            messageEl.style.border = "1px solid #e2e8f0";
        }

        const textSpan = document.createElement("div");
        textSpan.className = "ai-message-body";
        textSpan.innerHTML = text.replace(/\n/g, "<br>");
        messageEl.appendChild(textSpan);

        if (sender === "ai" && citations.length > 0) {
            const citationsContainer = document.createElement("div");
            citationsContainer.style.marginTop = "8px";
            citationsContainer.style.paddingTop = "8px";
            citationsContainer.style.borderTop = "1px dashed #cbd5e1";
            citationsContainer.style.display = "flex";
            citationsContainer.style.flexDirection = "column";
            citationsContainer.style.gap = "4px";

            const titleSpan = document.createElement("span");
            titleSpan.style.fontSize = "11px";
            titleSpan.style.fontWeight = "600";
            titleSpan.style.color = "#64748b";
            titleSpan.innerText = "Sumber / Kutipan Dokumen:";
            citationsContainer.appendChild(titleSpan);

            citations.forEach((cit) => {
                const citItem = document.createElement("div");
                citItem.className = "ai-citation";
                citItem.setAttribute("data-search", cit);
                citItem.style.fontSize = "11px";
                citItem.style.color = "#0284c7";
                citItem.style.cursor = "pointer";
                citItem.style.display = "flex";
                citItem.style.alignItems = "center";
                citItem.style.gap = "4px";
                citItem.style.textDecoration = "underline";
                citItem.innerHTML = `<i class="ms-Icon ms-Icon--Link" style="font-size: 10px;"></i> "${cit.substring(0, 60)}${cit.length > 60 ? '...' : ''}"`;
                citationsContainer.appendChild(citItem);
            });

            messageEl.appendChild(citationsContainer);
        }

        if (history) {
            history.appendChild(messageEl);
            history.scrollTop = history.scrollHeight;
        }

        return messageEl;
    }

    private async getApiKeyAndModel(): Promise<{ apiKey: string, model: string } | null> {
        const modelEl = document.getElementById("ai-model-select") as HTMLInputElement;
        
        const selectedModel = modelEl ? modelEl.value : DEFAULT_AI_MODEL;
        const isNvidia = selectedModel.includes('minimax');
        
        let apiKey = '';
        if (isNvidia) {
            apiKey = await StorageService.getItem("nvidia_api_key");
            if (!apiKey) {
                ToastService.show("Silakan atur NVIDIA API Key di menu Settings terlebih dahulu.", true);
                return null;
            }
        } else {
            apiKey = await StorageService.getItem("gemini_api_key");
            if (!apiKey) {
                ToastService.show("Silakan atur Gemini API Key di menu Settings terlebih dahulu.", true);
                return null;
            }
        }

        return {
            apiKey: apiKey,
            model: selectedModel
        };
    }

    private async handleSend() {
        if (this.isGenerating) return;

        const config = await this.getApiKeyAndModel();
        if (!config) return;

        const inputEl = document.getElementById("ai-chat-input") as HTMLInputElement;
        const skillValueEl = document.getElementById("ai-skill-value") as HTMLInputElement;
        if (!inputEl) return;
        
        const rawMessage = inputEl.value.trim();
        const skillContext = skillValueEl && skillValueEl.value ? `[Konteks Skill: ${skillValueEl.value}] ` : "";
        const finalMessage = skillContext + rawMessage;
        
        const userPrompt = finalMessage || "Tolong analisis, berikan feedback, dan revisi (jika diperlukan) tulisan ini.";
        
        this.appendMessage("user", userPrompt);
        inputEl.value = "";
        
        this.toggleLoadingState(true);
        
        const loadingMsgEl = this.appendMessage("ai", "Sedang menganalisis dokumen dan menyiapkan jawaban...");

        try {
            let docContext = "";
            let citations: string[] = [];

            await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load("text");
                await context.sync();

                if (selection.text && selection.text.trim().length > 0) {
                    docContext = selection.text;
                    citations.push(selection.text.trim());
                } else {
                    const body = context.document.body;
                    body.load("text");
                    await context.sync();
                    docContext = body.text;
                    
                    const paragraphs = body.paragraphs;
                    paragraphs.load("items/text");
                    await context.sync();
                    
                    const nonShortParas = paragraphs.items
                        .map(p => p.text.trim())
                        .filter(t => t.length > 40 && !t.toLowerCase().startsWith("bab "));
                    
                    if (nonShortParas.length > 0) {
                        citations.push(nonShortParas[0]);
                        if (nonShortParas.length > 1) {
                            citations.push(nonShortParas[Math.floor(nonShortParas.length / 2)]);
                        }
                    }
                }
            });

            const systemInstruction = `Anda adalah asisten AI ahli editor skripsi dan karya ilmiah Indonesia (ReySkripsi). 
Jawablah pertanyaan pengguna dengan jelas, akademis, dan terstruktur berdasarkan dokumen Word berikut:

--- KONTEKS DOKUMEN ---
${docContext.slice(0, 8000)}
-----------------------`;

            const aiResponse = await AiOrchestrator.generateResponse(
                userPrompt,
                config.apiKey,
                config.model,
                systemInstruction
            );

            if (loadingMsgEl && loadingMsgEl.parentNode) {
                loadingMsgEl.parentNode.removeChild(loadingMsgEl);
            }

            this.appendMessage("ai", aiResponse, citations);

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(error);
            if (loadingMsgEl && loadingMsgEl.parentNode) {
                loadingMsgEl.parentNode.removeChild(loadingMsgEl);
            }
            this.appendMessage("ai", `⚠️ Maaf, terjadi kesalahan: ${message || "Gagal menghubungi layanan AI."}`);
        } finally {
            this.toggleLoadingState(false);
        }
    }
}

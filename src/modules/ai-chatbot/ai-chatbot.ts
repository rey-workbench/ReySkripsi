import { marked } from 'marked';
import { IModule } from '@/core/interfaces';
import { ToastService } from '@/core/services/ui/toast-service';
import { AiOrchestrator } from '@/core/services/ai/ai-orchestrator';
import { IAiMessage, IAiRequestOptions } from '@/core/services/ai/iai-service';
import { StorageService, STORAGE_KEYS } from '@/core/services/storage/storage-service';
import { AI_MODEL_LIST, DEFAULT_AI_MODEL, isNvidiaModel } from '@/core/services/ai/ai-models';
import { ChatTemplate, AiSkill } from '@/modules/ai-chatbot/template';
import { WORD_TOOLS, executeWordTool, jumpToText } from '@/modules/ai-chatbot/word-tools';

marked.setOptions({ breaks: true, gfm: true });

const DEFAULT_PROMPT = 'Tolong analisis, berikan feedback, dan revisi (jika diperlukan) tulisan ini.';
const FAILED_TO_CONNECT = 'Gagal menghubungi layanan AI.';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

export class AiChatbotModule implements IModule {
    public id = "module-ai-chatbot";
    public name = "Ask AI";
    public iconClass = "ms-Icon--Robot";
    public iconColor = "#107c41";
    
    public get htmlContent(): string {
        return ChatTemplate.render();
    }

    private isGenerating = false;
    private chatHistory: IAiMessage[] = [];

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
                    const itemEl = (e.target as HTMLElement).closest('.ai-menu-item') as HTMLElement;
                    if (!itemEl) return;
                    if (skillBadge && skillText && skillValue) {
                        skillText.innerText = itemEl.innerText.trim();
                        skillValue.value = itemEl.getAttribute('data-skill') || '';
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
                        jumpToText(searchText);
                    }
                }
            });
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
        textSpan.innerHTML = marked.parse(escapeHtml(text)) as string;
        messageEl.appendChild(textSpan);

        if (sender === "ai") {
            this.appendOptionButtons(messageEl, text, textSpan);
        }

        this.appendCitations(messageEl, citations);

        if (history) {
            history.appendChild(messageEl);
            history.scrollTop = history.scrollHeight;
        }

        return messageEl;
    }

    private appendCitations(el: HTMLElement, citations: string[]): void {
        if (citations.length === 0) return;

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
            citItem.innerHTML = `<i class="ms-Icon ms-Icon--Link" style="font-size: 10px;"></i> "${escapeHtml(cit.substring(0, 60))}${cit.length > 60 ? '...' : ''}"`;
            citationsContainer.appendChild(citItem);
        });

        el.appendChild(citationsContainer);
    }

    private appendOptionButtons(el: HTMLElement, text: string, textSpan: HTMLElement): void {
        const optionRegex = /(?:^|\n)\s*(?:\*{0,2}\[([A-Z])\]\*{0,2}|\[([A-Z])\])\s*([^\n]+)/g;
        const matches = [...text.matchAll(optionRegex)];
        if (matches.length === 0) return;

        // Bersihkan teks [A], [B], [C] dari badan pesan utama agar tidak dobel/duplikat
        const cleanedText = text.replace(/(?:^|\n)\s*(?:\*{0,2}\[([A-Z])\]\*{0,2}|\[([A-Z])\])[^\n]+/g, "").trim();
        textSpan.innerHTML = marked.parse(escapeHtml(cleanedText)) as string;

        const optionsContainer = document.createElement("div");
        optionsContainer.className = "ai-options-container";
        optionsContainer.style.marginTop = "10px";
        optionsContainer.style.display = "flex";
        optionsContainer.style.flexDirection = "column";
        optionsContainer.style.gap = "6px";

        matches.forEach((m) => {
            const label = m[1] || m[2];
            const rawContent = m[3].trim().replace(/^\*\*|\*\*$/g, "");
            const parts = rawContent.split(/\s*[-–—:]\s*/);
            const title = parts[0].trim().replace(/^\*\*|\*\*$/g, "");
            const desc = parts.slice(1).join(" - ").trim().replace(/^\*\*|\*\*$/g, "");

            const btn = document.createElement("button");
            btn.className = "ai-option-card";
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.background = "#ffffff";
            btn.style.border = "1px solid #d1d5db";
            btn.style.borderRadius = "8px";
            btn.style.padding = "8px 12px";
            btn.style.cursor = "pointer";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.gap = "10px";
            btn.style.transition = "all 0.15s ease";

            btn.innerHTML = `
                <div style="width: 24px; height: 24px; border-radius: 6px; background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${label}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 12.5px; color: #1e293b;">${escapeHtml(title)}</div>
                    ${desc ? `<div style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(desc)}</div>` : ''}
                </div>
                <i class="ms-Icon ms-Icon--ChevronRight" style="font-size: 12px; color: #94a3b8; flex-shrink: 0;"></i>
            `;

            btn.onmouseover = () => {
                btn.style.borderColor = "#0078d4";
                btn.style.background = "#f0f7ff";
                btn.style.boxShadow = "0 2px 6px rgba(0, 120, 212, 0.12)";
            };
            btn.onmouseout = () => {
                btn.style.borderColor = "#d1d5db";
                btn.style.background = "#ffffff";
                btn.style.boxShadow = "none";
            };

            btn.onclick = () => {
                const inputEl = document.getElementById("ai-chat-input") as HTMLTextAreaElement | null;
                if (inputEl) {
                    inputEl.value = title;
                    inputEl.focus();
                    this.handleSend();
                }
            };

            optionsContainer.appendChild(btn);
        });

        el.appendChild(optionsContainer);
    }

    private async getApiKeyAndModel(): Promise<{ apiKey: string, model: string } | null> {
        const modelEl = document.getElementById("ai-model-select") as HTMLInputElement;
        
        const selectedModel = modelEl ? modelEl.value : DEFAULT_AI_MODEL;
        const isNvidia = isNvidiaModel(selectedModel);
        
        let apiKey = '';
        if (isNvidia) {
            apiKey = await StorageService.getItem(STORAGE_KEYS.NVIDIA_API_KEY);
            if (!apiKey) {
                ToastService.show("Silakan atur NVIDIA API Key di menu Settings terlebih dahulu.", true);
                return null;
            }
        } else {
            apiKey = await StorageService.getItem(STORAGE_KEYS.GEMINI_API_KEY);
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
        const skillTextEl = document.getElementById("ai-skill-text");
        if (!inputEl) return;
        
        const skill = (skillValueEl?.value || "").trim();
        const skillLabel = (skillTextEl?.innerText || skill).trim();
        const skillContext = skill ? `[Konteks Skill: ${skillLabel}] ` : "";
        const rawMessage = inputEl.value.trim();
        const finalMessage = skillContext + rawMessage;
        
        const userPrompt = finalMessage || DEFAULT_PROMPT;
        
        this.appendMessage("user", userPrompt);
        inputEl.value = "";
        
        this.toggleLoadingState(true);
        
        const loadingMsgEl = this.appendMessage("ai", "Sedang menganalisis dokumen dan menyiapkan jawaban...");
        let liveMsgEl: HTMLElement | null = null;
        let liveBody: HTMLElement | null = null;

        try {
            let docContext = "";
            let citations: string[] = [];

            if (skill === AiSkill.SELECTION) {
                const hasSelection = await Word.run(async (context) => {
                    const sel = context.document.getSelection();
                    sel.load("text");
                    await context.sync();
                    return !!sel.text && sel.text.trim().length > 0;
                });
                if (!hasSelection) {
                    ToastService.show("Tidak ada teks terpilih. Sorot teks terlebih dahulu, atau pilih skill lain.", true);
                    return;
                }
            }

            await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load("text");
                await context.sync();

                const hasSelection = !!selection.text && selection.text.trim().length > 0;

                if (skill === AiSkill.WHOLE_DOC || (!hasSelection && skill !== AiSkill.SELECTION)) {
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
                } else if (hasSelection) {
                    docContext = selection.text;
                    citations.push(selection.text.trim());
                }
            });

            const systemInstruction = `Anda adalah asisten AI ahli editor skripsi dan karya ilmiah Indonesia (ReySkripsi).
Jawablah pertanyaan pengguna dengan jelas, akademis, dan terstruktur berdasarkan dokumen Word berikut:

--- KONTEKS DOKUMEN ---
${docContext.slice(0, 32000)}
-----------------------

PANDUAN INTERAKSI:
1. Jika pengguna meminta tindakan pada dokumen dan tool tersedia (seperti formatForeignWordsItalic, scanDocument, atau insertText), LANGSUNG panggil tool tersebut. JANGAN hanya mengklaim selesai dalam teks tanpa memanggil tool!
2. Jika pengguna meminta menyisipkan teks, ingatkan atau instruksikan pengguna untuk meletakkan kursor di posisi dokumen yang diinginkan. Teks yang dimasukkan via insertText HARUS berupa teks bersih tanpa escape sequence literal '\\n' atau markup markdown tabel mentah yang rusak.
3. JANGAN mengubah daftar bernomor penjelasan materi (misal: "1. Plagiarisme: ...") menjadi opsi pilihan.
4. HANYA sertakan opsi jika Anda benar-benar memerlukan keputusan atau arah selanjutnya dari pengguna. Letakkan di paling akhir pesan dengan format persis:
[A] Judul Opsi Pertama - Penjelasan singkat
[B] Judul Opsi Kedua - Penjelasan singkat
[C] Judul Opsi Ketiga - Penjelasan singkat
Atau ketik pilihan sendiri.`;

            const isNvidia = isNvidiaModel(config.model);

            let streamedMsgEl: HTMLElement | null = null;

            const aiOptions: IAiRequestOptions = {
                history: this.chatHistory.slice(-10),
                ...(isNvidia ? {} : {
                    tools: WORD_TOOLS,
                    onStream: (partial: string) => {
                        if (!streamedMsgEl) {
                            if (loadingMsgEl && loadingMsgEl.parentNode) {
                                loadingMsgEl.parentNode.removeChild(loadingMsgEl);
                            }
                            streamedMsgEl = this.appendMessage("ai", partial);
                            liveBody = streamedMsgEl.querySelector(".ai-message-body") as HTMLElement | null;
                        } else if (liveBody) {
                            liveBody.innerHTML = marked.parse(escapeHtml(partial)) as string;
                            const history = document.getElementById("ai-chat-history");
                            if (history) history.scrollTop = history.scrollHeight;
                        }
                    }
                })
            };
            if (!isNvidia) {
                if (skill === AiSkill.SEARCH) aiOptions.searchGrounding = true;
                if (skill === AiSkill.THINKING) aiOptions.thinking = true;
                if (skill === AiSkill.CODE) aiOptions.codeExecution = true;
            }

            const aiResponse = await AiOrchestrator.generateResponse(
                userPrompt,
                config.apiKey,
                config.model,
                systemInstruction,
                aiOptions,
                isNvidia ? undefined : executeWordTool
            );

            const finalTargetEl = (streamedMsgEl || liveMsgEl) as HTMLElement | null;
            if (finalTargetEl) {
                const liveBody = finalTargetEl.querySelector(".ai-message-body") as HTMLElement | null;
                if (liveBody) {
                    this.appendOptionButtons(finalTargetEl, aiResponse, liveBody);
                }
                this.appendCitations(finalTargetEl, citations);
            } else {
                if (loadingMsgEl && loadingMsgEl.parentNode) {
                    loadingMsgEl.parentNode.removeChild(loadingMsgEl);
                }
                this.appendMessage("ai", aiResponse, citations);
            }

            this.chatHistory.push(
                { role: 'user', text: userPrompt },
                { role: 'model', text: aiResponse }
            );
            if (this.chatHistory.length > 20) {
                this.chatHistory = this.chatHistory.slice(-20);
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(error);
            if (!liveMsgEl && loadingMsgEl && loadingMsgEl.parentNode) {
                loadingMsgEl.parentNode.removeChild(loadingMsgEl);
            }
            this.appendMessage("ai", `⚠️ Maaf, terjadi kesalahan: ${message || FAILED_TO_CONNECT}`);
        } finally {
            this.toggleLoadingState(false);
        }
    }
}

import { AI_MODEL_LIST, DEFAULT_AI_MODEL } from '@/core/services/ai/ai-models';

export enum AiSkill {
    WHOLE_DOC = "whole-doc",
    SELECTION = "selection",
    SEARCH = "search",
    THINKING = "thinking",
    CODE = "code",
}

export class ChatTemplate {
    static render(): string {
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
            <div class="module-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div style="display: flex; align-items: center;">
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
                <button id="ai-btn-revert" style="display: none; align-items: center; gap: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #b91c1c; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; cursor: pointer; transition: all 0.2s;" title="Batalkan perubahan dokumen terakhir yang dilakukan AI">
                    <i class="ms-Icon ms-Icon--Undo" style="font-size: 11px;"></i> Revert AI
                </button>
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
                            <div class="ai-menu-item" data-skill="${AiSkill.WHOLE_DOC}" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                                <i class="ms-Icon ms-Icon--Document" style="font-size: 16px; color: #6b7280;"></i>
                                Gunakan Seluruh Dokumen
                            </div>
                            <div class="ai-menu-item" data-skill="${AiSkill.SELECTION}" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                                <i class="ms-Icon ms-Icon--TextDocument" style="font-size: 16px; color: #6b7280;"></i>
                                Fokus Teks Terpilih
                            </div>
                            <div style="height: 1px; background: #e2e8f0; margin: 6px 0;"></div>
                            <div class="ai-menu-item" data-skill="${AiSkill.SEARCH}" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                                <i class="ms-Icon ms-Icon--Search" style="font-size: 16px; color: #6b7280;"></i>
                                Pencarian Web (Search Grounding)
                            </div>
                            <div class="ai-menu-item" data-skill="${AiSkill.THINKING}" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
                                <i class="ms-Icon ms-Icon--Lightbulb" style="font-size: 16px; color: #6b7280;"></i>
                                Mode Berpikir (Thinking)
                            </div>
                            <div class="ai-menu-item" data-skill="${AiSkill.CODE}" style="padding: 10px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #374151; transition: background 0.2s;" onmouseover="this.style.background='#f3f2f1'" onmouseout="this.style.background='transparent'">
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
}

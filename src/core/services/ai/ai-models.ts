/**
 * Centralized Enum dan Metadata untuk seluruh Model AI (Gemini 3 Family & NVIDIA)
 */
export enum AiModel {
  GEMINI_3_FLASH = "gemini-3-flash-preview",
  GEMINI_3_PRO = "gemini-3.1-pro-preview",
  GEMINI_3_1_FLASH = "gemini-3.1-flash-lite",
  NVIDIA_MINIMAX_M3 = "minimax-m3"
}

export interface IAiModelConfig {
  value: AiModel;
  label: string;
  isNvidia?: boolean;
}

export const AI_MODEL_LIST: IAiModelConfig[] = [
  { value: AiModel.GEMINI_3_FLASH, label: "Gemini 3 Flash (Fast & Recommended)" },
  { value: AiModel.GEMINI_3_1_FLASH, label: "Gemini 3.1 Flash-Lite" },
  { value: AiModel.GEMINI_3_PRO, label: "Gemini 3.1 Pro" },
  { value: AiModel.NVIDIA_MINIMAX_M3, label: "Minimax-M3 (NVIDIA)", isNvidia: true }
];

export const DEFAULT_AI_MODEL = AiModel.GEMINI_3_FLASH;

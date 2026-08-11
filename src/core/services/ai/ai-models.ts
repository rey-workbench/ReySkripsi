/**
 * Centralized Enum dan Metadata untuk seluruh Model AI (Gemini & NVIDIA)
 */
export enum AiModel {
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
  GEMINI_2_5_PRO = "gemini-2.5-pro",
  GEMINI_1_5_FLASH = "gemini-1.5-flash",
  GEMINI_1_5_FLASH_8B = "gemini-1.5-flash-8b",
  NVIDIA_MINIMAX_M3 = "minimax-m3"
}

export interface IAiModelConfig {
  value: AiModel;
  label: string;
  isNvidia?: boolean;
}

export const AI_MODEL_LIST: IAiModelConfig[] = [
  { value: AiModel.GEMINI_2_5_FLASH, label: "Gemini 2.5 Flash (Paling Stabil & Cepat)" },
  { value: AiModel.GEMINI_1_5_FLASH_8B, label: "Gemini 1.5 Flash-8B (Super Hemat & Ringan)" },
  { value: AiModel.GEMINI_1_5_FLASH, label: "Gemini 1.5 Flash" },
  { value: AiModel.GEMINI_2_5_PRO, label: "Gemini 2.5 Pro (Presisi Tinggi)" },
  { value: AiModel.NVIDIA_MINIMAX_M3, label: "Minimax-M3 (NVIDIA)", isNvidia: true }
];

export const DEFAULT_AI_MODEL = AiModel.GEMINI_2_5_FLASH;

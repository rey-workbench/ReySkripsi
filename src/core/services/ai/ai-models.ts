/**
 * Centralized Enum dan Metadata untuk seluruh Model AI (Gemini & NVIDIA)
 */
export enum AiModel {
  GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite",
  GEMINI_2_5_FLASH = "gemini-2.5-flash",
  GEMINI_2_5_PRO = "gemini-2.5-pro",
  GEMINI_3_5_FLASH_LITE = "gemini-3.5-flash-lite",
  GEMINI_3_5_FLASH = "gemini-3.5-flash",
  GEMINI_3_6_FLASH = "gemini-3.6-flash",
  NVIDIA_MINIMAX_M3 = "minimax-m3"
}

export interface IAiModelConfig {
  value: AiModel;
  label: string;
  isNvidia?: boolean;
}

export const AI_MODEL_LIST: IAiModelConfig[] = [
  { value: AiModel.GEMINI_2_5_FLASH_LITE, label: "Gemini 2.5 Flash-Lite (Super Hemat & Cepat)" },
  { value: AiModel.GEMINI_2_5_FLASH, label: "Gemini 2.5 Flash" },
  { value: AiModel.GEMINI_2_5_PRO, label: "Gemini 2.5 Pro" },
  { value: AiModel.GEMINI_3_5_FLASH_LITE, label: "Gemini 3.5 Flash-Lite" },
  { value: AiModel.GEMINI_3_5_FLASH, label: "Gemini 3.5 Flash" },
  { value: AiModel.GEMINI_3_6_FLASH, label: "Gemini 3.6 Flash" },
  { value: AiModel.NVIDIA_MINIMAX_M3, label: "Minimax-M3 (NVIDIA)", isNvidia: true }
];

export const DEFAULT_AI_MODEL = AiModel.GEMINI_2_5_FLASH_LITE;

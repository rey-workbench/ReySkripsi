export const AI_NO_RESPONSE_MESSAGE = 'Maaf, AI tidak dapat memberikan respons saat ini.';

export function aiTimeoutMessage(provider: string): string {
  return `Permintaan ke ${provider} API melebihi waktu tunggu (60 detik).`;
}

export interface IAiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface IAiToolDefinition {
  name: string;
  description: string;
  parameters: object;
}

export interface IAiToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface IAiToolResult {
  name: string;
  result: unknown;
}

export interface IAiTurn {
  text: string;
  toolCalls: IAiToolCall[];
}

export interface IAiRequestOptions {
  searchGrounding?: boolean;
  codeExecution?: boolean;
  thinking?: boolean;
  history?: IAiMessage[];
  tools?: IAiToolDefinition[];
  toolCalls?: IAiToolCall[];
  toolResults?: IAiToolResult[];
  onStream?: (text: string) => void;
}

export interface IAiService {
  generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string, options?: IAiRequestOptions): Promise<IAiTurn>;
}

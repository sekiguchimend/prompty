export interface CodeGenerationRequest {
  prompt: string;
  framework?: string;
  styling?: string;
  complexity?: string;
  model?: string;
  language?: 'ja' | 'en';
  preserveExisting?: boolean;
}

export type ModelType = 'claude-3-7-sonnet-20250219' | 'claude-3-5-sonnet-20241022' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229';
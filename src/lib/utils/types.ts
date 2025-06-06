export interface UIGenerationRequest {
  prompt: string;
  existingCode?: {
    html?: string;
    css?: string;
    js?: string;
  };
  isIteration?: boolean;
}

export interface UIGenerationResponse {
  html: string;
  css: string;
  js: string;
  description: string;
} 
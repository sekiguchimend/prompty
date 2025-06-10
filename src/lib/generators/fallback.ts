import { UIGenerationResponse } from '../utils/types';

export function generateFallbackUI(prompt: string): UIGenerationResponse {
  return {
    html: `<h1>${prompt}</h1><p>Generated UI placeholder</p>`,
    css: 'body { font-family: Arial, sans-serif; }',
    js: '',
    description: `Generated UI for: ${prompt}`
  };
}
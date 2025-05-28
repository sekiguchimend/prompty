// Gemini API用のベースURL設定
const getGeminiApiBaseUrl = (): string => {
  // ブラウザ環境での判定
  if (typeof window !== 'undefined') {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // ローカル開発環境では直接3002ポートのGeminiサーバーにアクセス
      return 'http://localhost:3002/api';
    } else {
      // 本番環境ではNEXT_PUBLIC_URLを使用
      const baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      return `${baseUrl}/api`;
    }
  }
  
  // サーバーサイドでは環境変数を使用
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.NEXT_PUBLIC_URL || ''}/api`;
  } else {
    return 'http://localhost:3002/api';
  }
};

const GEMINI_API_BASE_URL = getGeminiApiBaseUrl();

export interface CodeGenerationRequest {
  prompt: string;
  framework: 'react' | 'vue' | 'vanilla' | 'nextjs' | 'svelte';
  language: 'javascript' | 'typescript';
  styling: 'css' | 'tailwind' | 'styled-components' | 'emotion';
  complexity: 'simple' | 'intermediate' | 'advanced';
}

export interface CodeGenerationResponse {
  files: {
    [filename: string]: string;
  };
  dependencies?: string[];
  description: string;
  instructions?: string;
}

// APIクライアント関数
const callGeminiApi = async (endpoint: string, data: any): Promise<any> => {
  const url = `${GEMINI_API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Gemini API Error (${endpoint}):`, error);
    throw error;
  }
};

// コード生成メイン関数
export const generateCode = async (request: CodeGenerationRequest): Promise<CodeGenerationResponse> => {
  try {
    const response = await callGeminiApi('/generate-code', request);
    
    // レスポンスの検証
    if (!response.files || typeof response.files !== 'object') {
      throw new Error('ファイル情報が不正です');
    }

    return {
      files: response.files,
      dependencies: response.dependencies || [],
      description: response.description || 'Generated Code Project',
      instructions: response.instructions || ''
    };

  } catch (error) {
    console.error('コード生成エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード生成に失敗しました');
  }
};

// コード改善機能
export const improveCode = async (
  originalCode: string, 
  improvementRequest: string,
  framework: string
): Promise<CodeGenerationResponse> => {
  try {
    const response = await callGeminiApi('/improve-code', {
      originalCode,
      improvementRequest,
      framework
    });

    return response;

  } catch (error) {
    console.error('コード改善エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード改善に失敗しました');
  }
};

// コード説明機能
export const explainCode = async (code: string): Promise<string> => {
  try {
    const response = await callGeminiApi('/explain-code', { code });
    return response.explanation || 'コードの説明を取得できませんでした';

  } catch (error) {
    console.error('コード説明エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード説明に失敗しました');
  }
}; 
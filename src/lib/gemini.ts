import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDquv5JsikJVqweEAOtMxEt5oTEtI4IMmc';

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(API_KEY);

// Gemini 2.0 Flash モデルを使用
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

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

// プロンプトテンプレートの生成
const generateSystemPrompt = (request: CodeGenerationRequest): string => {
  const { framework, language, styling, complexity } = request;
  
  return `あなたは優秀なフロントエンド開発者です。以下の要件に基づいてコードを生成してください：

**技術要件:**
- フレームワーク: ${framework}
- 言語: ${language}
- スタイリング: ${styling}
- 複雑さ: ${complexity}

**出力形式:**
以下のJSON形式で応答してください：

\`\`\`json
{
  "files": {
    "ファイル名": "ファイル内容"
  },
  "dependencies": ["依存関係のリスト"],
  "description": "プロジェクトの説明",
  "instructions": "使用方法や注意事項"
}
\`\`\`

**コード生成ルール:**
1. 実際に動作する完全なコードを生成する
2. ${framework}の最新のベストプラクティスに従う
3. ${styling}を使用してモダンで美しいUIを作成する
4. レスポンシブデザインを考慮する
5. アクセシビリティを考慮する
6. コメントを適切に記述する
7. エラーハンドリングを含める
8. ${complexity}レベルに適した機能を実装する

**ファイル構成:**
- メインコンポーネントファイル
- スタイルファイル（必要に応じて）
- 設定ファイル（必要に応じて）
- README.md（使用方法を記載）

ユーザーのリクエスト: `;
};

// コード生成メイン関数
export const generateCode = async (request: CodeGenerationRequest): Promise<CodeGenerationResponse> => {
  try {
    const systemPrompt = generateSystemPrompt(request);
    const fullPrompt = systemPrompt + request.prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // JSONレスポンスを抽出
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[1]);
    
    // レスポンスの検証
    if (!parsedResponse.files || typeof parsedResponse.files !== 'object') {
      throw new Error('ファイル情報が不正です');
    }

    return {
      files: parsedResponse.files,
      dependencies: parsedResponse.dependencies || [],
      description: parsedResponse.description || 'Generated Code Project',
      instructions: parsedResponse.instructions || ''
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
    const prompt = `以下のコードを改善してください：

**改善要求:** ${improvementRequest}
**フレームワーク:** ${framework}

**元のコード:**
${originalCode}

**出力形式:**
\`\`\`json
{
  "files": {
    "ファイル名": "改善されたファイル内容"
  },
  "dependencies": ["必要な依存関係"],
  "description": "改善内容の説明",
  "instructions": "変更点や使用方法"
}
\`\`\`

改善されたコードを生成してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }

    return JSON.parse(jsonMatch[1]);

  } catch (error) {
    console.error('コード改善エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード改善に失敗しました');
  }
};

// コード説明機能
export const explainCode = async (code: string): Promise<string> => {
  try {
    const prompt = `以下のコードについて、わかりやすく説明してください：

${code}

**説明に含めてください:**
1. コードの目的と機能
2. 主要な技術やライブラリ
3. コードの構造
4. 重要な部分の解説
5. 使用方法

日本語で詳しく説明してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('コード説明エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード説明に失敗しました');
  }
}; 
// 高品質AIコード生成ライブラリ (Claude 3.5 Sonnet ベース) - Enhanced Version
// 既存コード保護機能付き

export interface CodeGenerationRequest {
  prompt: string;
  model?: string;
  language?: 'ja' | 'en';
  preserveExisting?: boolean;
  targetFramework?: string;
}

export interface CodeGenerationResponse {
  files: Record<string, string>;
  description: string;
  instructions?: string;
  framework: string;
  language: string;
  styling: string;
  usedModel?: string;
  preservedFeatures?: string[];
  improvements?: string[];
  warnings?: string[];
}

export interface CodeImprovementOptions {
  preserveStructure: boolean;
  preserveStyles: boolean;
  preserveFunctionality: boolean;
  enhanceOnly: boolean;
  targetAreas?: string[];
}

// APIベースURL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api'
  : 'http://localhost:3000/api';

// 共通のAPIコール関数（エラーハンドリング強化）
async function callApi(endpoint: string, data: any): Promise<any> {
  try {
    console.log(`🚀 [Claude Client] API Call: ${endpoint}`, { 
      prompt: data.prompt?.substring(0, 100) + '...',
      model: data.model,
      language: data.language 
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Claude Client] API Error (${response.status}):`, errorText);
      
      // より詳細なエラーメッセージ
      let errorMessage = `Claude API Error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`✅ [Claude Client] API Success:`, { 
      files: Object.keys(result.files || {}),
      description: result.description?.substring(0, 100) + '...',
      framework: result.framework,
      usedModel: result.usedModel
    });
    
    return result;
  } catch (error) {
    console.error(`❌ [Claude Client] Network Error:`, error);
    
    // ネットワークエラーの場合のより詳細な情報
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('ネットワーク接続エラー: Claude APIサーバーに接続できません');
    }
    
    throw error;
  }
}

// メインのコード生成関数（Claude 3.5 Sonnet ベース）
export async function generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  // 入力検証
  if (!request.prompt || request.prompt.trim().length === 0) {
    throw new Error('プロンプトが空です');
  }
  
  if (request.prompt.length > 10000) {
    throw new Error('プロンプトが長すぎます（10,000文字以内）');
  }
  
  return callApi('/generate-code', {
    prompt: request.prompt.trim(),
    model: request.model || 'claude-3.5-sonnet',
    language: request.language || 'ja'
  });
}

// コード改善関数（Claude 3.5 Sonnet ベース・既存コード保護強化）
export async function improveCode(
  originalCode: string,
  improvementRequest: string,
  framework: string = 'react',
  model: string = 'claude-3.5-sonnet',
  language: 'ja' | 'en' = 'ja',
  options: CodeImprovementOptions = {
    preserveStructure: true,
    preserveStyles: true,
    preserveFunctionality: true,
    enhanceOnly: true
  }
): Promise<CodeGenerationResponse> {
  // 入力検証
  if (!originalCode || originalCode.trim().length === 0) {
    throw new Error('元のコードが空です');
  }
  
  if (!improvementRequest || improvementRequest.trim().length === 0) {
    throw new Error('改善要求が空です');
  }
  
  if (originalCode.length > 200000) {
    throw new Error('元のコードが長すぎます（200,000文字以内）');
  }
  
  if (improvementRequest.length > 20000) {
    throw new Error('改善要求が長すぎます（20,000文字以内）');
  }

  // 既存コードの構造分析
  const codeAnalysis = analyzeCodeStructure(originalCode);
  
  return callApi('/improve-code-enhanced', {
    originalCode: originalCode.trim(),
    improvementRequest: improvementRequest.trim(),
    framework,
    model,
    language,
    preservationOptions: options,
    codeAnalysis
  });
}

// コード構造分析関数（既存機能の保護用）
function analyzeCodeStructure(code: string): {
  functions: string[];
  classes: string[];
  cssClasses: string[];
  htmlElements: string[];
  eventListeners: string[];
  variables: string[];
} {
  const analysis: {
    functions: string[];
    classes: string[];
    cssClasses: string[];
    htmlElements: string[];
    eventListeners: string[];
    variables: string[];
  } = {
    functions: [],
    classes: [],
    cssClasses: [],
    htmlElements: [],
    eventListeners: [],
    variables: []
  };

  try {
    // JavaScript関数の検出
    const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*:\s*function|(\w+)\s*=>\s*/g);
    if (functionMatches) {
      analysis.functions = functionMatches.map(match =>
        match.replace(/function\s+|const\s+|:\s*function|=>\s*|\s*=\s*\(/g, '').trim()
      ).filter(name => name.length > 0);
    }

    // CSSクラスの検出
    const cssClassMatches = code.match(/\.[\w-]+(?=\s*{)/g);
    if (cssClassMatches) {
      analysis.cssClasses = cssClassMatches.map(match => match.substring(1));
    }

    // HTMLクラス属性の検出
    const htmlClassMatches = code.match(/class\s*=\s*["']([^"']+)["']/g);
    if (htmlClassMatches) {
      const htmlClasses = htmlClassMatches.flatMap(match =>
        match.replace(/class\s*=\s*["']|["']/g, '').split(/\s+/)
      );
      const uniqueClasses = Array.from(new Set([...analysis.cssClasses, ...htmlClasses]));
      analysis.cssClasses = uniqueClasses;
    }

    // HTMLタグの検出
    const htmlTagMatches = code.match(/<(\w+)(?:\s|>)/g);
    if (htmlTagMatches) {
      const uniqueTags = Array.from(new Set(htmlTagMatches.map(match =>
        match.replace(/<|>|\s/g, '')
      )));
      analysis.htmlElements = uniqueTags;
    }

    // イベントリスナーの検出
    const eventMatches = code.match(/addEventListener\s*\(\s*["'](\w+)["']|on\w+\s*=/g);
    if (eventMatches) {
      analysis.eventListeners = eventMatches.map(match =>
        match.replace(/addEventListener\s*\(\s*["']|["']|on|=/g, '').trim()
      );
    }

    // 変数の検出
    const variableMatches = code.match(/(?:var|let|const)\s+(\w+)/g);
    if (variableMatches) {
      analysis.variables = variableMatches.map(match =>
        match.replace(/var\s+|let\s+|const\s+/g, '').trim()
      );
    }
  } catch (error) {
    console.warn('コード構造分析でエラーが発生しました:', error);
  }

  return analysis;
}

// コード説明機能（詳細分析対応）
export const explainCode = async (code: string, language: 'ja' | 'en' = 'ja'): Promise<string> => {
  try {
    // 入力検証
    if (!code || code.trim().length === 0) {
      throw new Error('コードが空です');
    }
    
    if (code.length > 100000) {
      throw new Error('コードが長すぎます（100,000文字以内）');
    }
    
    const response = await fetch(`${API_BASE_URL}/explain-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code: code.trim(),
        language 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ コード説明エラー:`, errorText);
      throw new Error(`コード説明に失敗しました: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.explanation || 'コードの説明を取得できませんでした';
  } catch (error) {
    console.error('❌ コード説明エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'コード説明に失敗しました');
  }
};

// プロジェクト保存機能
export const saveProject = (project: {
  title: string;
  description: string;
  prompt: string;
  files: Record<string, string>;
  framework: string;
  language: string;
  styling: string;
}): string => {
  try {
    const savedProjects = JSON.parse(localStorage.getItem('codeProjects') || '[]');
    const projectWithId = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    savedProjects.push(projectWithId);
    localStorage.setItem('codeProjects', JSON.stringify(savedProjects));
    
    console.log('✅ プロジェクト保存完了:', projectWithId.id);
    return projectWithId.id;
  } catch (error) {
    console.error('❌ プロジェクト保存エラー:', error);
    throw new Error('プロジェクトの保存に失敗しました');
  }
};

// プロジェクト読み込み機能
export const loadProjects = (): any[] => {
  try {
    const savedProjects = JSON.parse(localStorage.getItem('codeProjects') || '[]');
    console.log('📂 プロジェクト読み込み完了:', savedProjects.length, '件');
    return savedProjects;
  } catch (error) {
    console.error('❌ プロジェクト読み込みエラー:', error);
    return [];
  }
};

// プロジェクト削除機能
export const deleteProject = (projectId: string): boolean => {
  try {
    const savedProjects = JSON.parse(localStorage.getItem('codeProjects') || '[]');
    const filteredProjects = savedProjects.filter((p: any) => p.id !== projectId);
    localStorage.setItem('codeProjects', JSON.stringify(filteredProjects));
    
    console.log('🗑️ プロジェクト削除完了:', projectId);
    return true;
  } catch (error) {
    console.error('❌ プロジェクト削除エラー:', error);
    return false;
  }
};

// コードダウンロード機能
export const downloadCode = async (files: Record<string, string>, projectName: string = 'ai-generated-app'): Promise<void> => {
  try {
    // 動的インポートでJSZipを読み込み
    const JSZip = (await import('jszip')).default;
    
    const zip = new JSZip();
    
    // ファイルをZIPに追加
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    // README.mdを追加
    const readme = `# ${projectName}

AI Generated Web Application

## ファイル構成
${Object.keys(files).map(filename => `- ${filename}`).join('\n')}

## 使用方法
1. index.htmlをブラウザで開く
2. または、ローカルサーバーで実行する

## 生成日時
${new Date().toLocaleString('ja-JP')}
`;
    
    zip.file('README.md', readme);
    
    // ZIPファイルを生成してダウンロード
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 ダウンロード完了:', projectName);
  } catch (error) {
    console.error('❌ ダウンロードエラー:', error);
    throw new Error('ファイルのダウンロードに失敗しました');
  }
};

// コードコピー機能
export const copyCode = async (files: Record<string, string>): Promise<void> => {
  try {
    const codeText = Object.entries(files)
      .map(([filename, content]) => `// ===== ${filename} =====\n${content}`)
      .join('\n\n');
    
    await navigator.clipboard.writeText(codeText);
    console.log('📋 コピー完了');
  } catch (error) {
    console.error('❌ コピーエラー:', error);
    throw new Error('クリップボードへのコピーに失敗しました');
  }
};

// 利用可能なモデル一覧
export const AVAILABLE_MODELS = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: '最新・バランス型',
    icon: '⚡',
    provider: 'Anthropic'
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: '最高性能・複雑なタスク（推奨）',
    icon: '🎯',
    provider: 'Anthropic'
  }
] as const;

// フレームワーク検出機能
export const detectFramework = (files: Record<string, string>): string => {
  const fileNames = Object.keys(files);
  const fileContents = Object.values(files).join('\n').toLowerCase();
  
  // React検出
  if (fileNames.some(name => name.endsWith('.jsx') || name.endsWith('.tsx')) ||
      fileContents.includes('react') || fileContents.includes('jsx')) {
    return 'react';
  }
  
  // Vue検出
  if (fileNames.some(name => name.endsWith('.vue')) ||
      fileContents.includes('vue')) {
    return 'vue';
  }
  
  // Next.js検出
  if (fileContents.includes('next') || fileContents.includes('getstaticprops')) {
    return 'nextjs';
  }
  
  // Svelte検出
  if (fileNames.some(name => name.endsWith('.svelte')) ||
      fileContents.includes('svelte')) {
    return 'svelte';
  }
  
  // TypeScript検出
  if (fileNames.some(name => name.endsWith('.ts') || name.endsWith('.tsx'))) {
    return 'typescript';
  }
  
  // デフォルト
  return 'vanilla-js';
};
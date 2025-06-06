import { NextApiRequest, NextApiResponse } from 'next';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface CodeImprovementRequest {
  originalCode: string;
  improvementRequest: string;
  framework?: string;
  model?: string;
  language?: 'ja' | 'en';
}

interface CodeGenerationResponse {
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

const generateEnhancedImprovementPrompt = (
  originalCode: string,
  improvementRequest: string,
  framework: string,
  model: string,
  language: string = 'ja',
  codeAnalysis?: any
) => {
  const isJapanese = language === 'ja';
  
  // 既存コードの重要な要素を抽出
  const preservedElements = codeAnalysis ? `
## 保護すべき既存要素
- 関数: ${codeAnalysis.functions?.join(', ') || 'なし'}
- CSSクラス: ${codeAnalysis.cssClasses?.join(', ') || 'なし'}
- HTMLタグ: ${codeAnalysis.htmlElements?.join(', ') || 'なし'}
- イベントリスナー: ${codeAnalysis.eventListeners?.join(', ') || 'なし'}
- 変数: ${codeAnalysis.variables?.join(', ') || 'なし'}
` : '';

  return `あなたは世界最高レベルのフルスタック開発者です。既存のコードを改善してください。

## 🔒 絶対的な保護原則
1. **既存機能の100%保持**: 現在動作している機能は絶対に削除・破壊・変更しない
2. **構造の完全保護**: 既存のHTML構造、CSS クラス名、JavaScript関数名は変更禁止
3. **段階的拡張のみ**: 既存コードに新機能を「追加」するのみ、「置換」は禁止
4. **互換性の絶対維持**: 既存のイベントハンドラー、スタイル、動作は完全に保持
5. **安全第一**: 不明な場合は改善を控え、既存コードを保護

${preservedElements}

## 📋 現在のコード（完全保護対象）
${originalCode}

## 🎯 改善要求
${improvementRequest}

## ✅ 許可される改善方法
- 新しいCSSクラスの追加（既存クラスは変更禁止）
- 新しいJavaScript関数の追加（既存関数は変更禁止）
- 新しいHTML要素の追加（既存要素は変更禁止）
- 既存スタイルの拡張（上書きは禁止）
- パフォーマンス最適化（機能変更なし）

## ❌ 禁止される変更
- 既存の関数名、クラス名、ID名の変更
- 既存のHTML構造の変更
- 既存のCSS プロパティの削除・変更
- 既存のイベントリスナーの削除・変更
- 既存の変数名の変更

## 🛡️ 保護チェックリスト
改善前に以下を確認：
1. 既存の全ての関数が保持されているか？
2. 既存の全てのCSSクラスが保持されているか？
3. 既存のHTML構造が保持されているか？
4. 既存のイベント処理が保持されているか？
5. 既存の動作が完全に維持されているか？

## 📝 レスポンス形式（必須）
⚠️ 重要: 以下の形式を厳密に守ってください。
⚠️ 重要: コード内の改行は\\nでエスケープし、一行の文字列として記述してください。
⚠️ 重要: ダブルクォートは\\"でエスケープしてください。
⚠️ 重要: バックスラッシュは\\\\でエスケープしてください。

正しい形式:
{
  "files": {
    "index.html": "<!DOCTYPE html>\\n<html lang=\\"ja\\">\\n<head>\\n<title>タイトル</title>\\n</head>\\n<body>\\n既存のコンテンツ\\n新しいコンテンツ\\n</body>\\n</html>",
    "style.css": "/* 既存のスタイル */\\n.existing-class { color: blue; }\\n/* 新しいスタイル */\\n.new-class { color: red; }",
    "script.js": "// 既存のJavaScript\\nfunction existingFunction() { return true; }\\n// 新しいJavaScript\\nfunction newFunction() { return false; }"
  },
  "description": "${isJapanese ? '追加した新機能の詳細説明(既存機能は保護済み)' : 'Description of added features (existing features protected)'}",
  "instructions": "${isJapanese ? '新機能の使用方法(既存機能への影響なし)' : 'Usage instructions for new features (no impact on existing)'}",
  "framework": "${framework}",
  "language": "javascript",
  "styling": "css",
  "usedModel": "${model}",
  "preservedFeatures": ["既存機能1", "既存機能2"],
  "improvements": ["追加機能1", "追加機能2"],
  "warnings": ["注意点があれば記載"]
}

## ⚠️ 最重要注意事項
- 既存コードの一行たりとも削除・変更してはいけません
- 新機能は既存機能に「追加」するのみです
- 不明な場合は改善を控え、既存コードを完全に保護してください
- JSONのみ返答し、説明文やコードブロックは含めないでください
- 必ず有効なJSONのみを返す（説明文やコードブロックは含めない）
- 文字列内の特殊文字は適切にエスケープする
- 改行は\\n、ダブルクォートは\\"、バックスラッシュは\\\\でエスケープ`;
};

async function callClaudeAPI(prompt: string, model: string): Promise<string> {
  if (!CLAUDE_API_KEY) throw new Error('Claude API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent improvements
      messages: [{ role: 'user', content: prompt }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Claude API Error:', errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}


function extractAndFixJSON(text: string, originalCode?: string): CodeGenerationResponse {
  console.log('🔧 Enhanced JSON処理開始:', text.length, '文字');
  
  // Remove code blocks and clean text
  let cleanText = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
  
  // Find JSON boundaries
  const start = cleanText.indexOf('{');
  const end = cleanText.lastIndexOf('}');
  
  if (start === -1 || end === -1 || start >= end) {
    throw new Error('有効なJSONが見つかりません');
  }
  
  let jsonString = cleanText.slice(start, end + 1);
  
  // Enhanced fixes with better error handling
  const fixes = [
    // Fix 1: Try direct parse first
    () => {
      console.log('🔄 Enhanced修復試行 1');
      return JSON.parse(jsonString);
    },
    
    // Fix 2: Basic cleanup
    () => {
      console.log('🔄 Enhanced修復試行 2');
      const cleaned = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"'); // Convert single quotes to double
      return JSON.parse(cleaned);
    },
    
    // Fix 3: Handle template literals and backticks
    () => {
      console.log('🔄 Enhanced修復試行 3');
      // Replace template literals with regular strings
      let fixed = jsonString.replace(/`([^`]*)`/g, (match, content) => {
        const escaped = content
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      });
      
      // Additional cleanup
      fixed = fixed
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
      
      return JSON.parse(fixed);
    },
    
    // Fix 4: Normalize string values
    () => {
      console.log('🔄 Enhanced修復試行 4');
      let fixed = jsonString;
      
      // Fix string values with proper escaping
      fixed = fixed.replace(/"([^"]*)"/g, (match, content) => {
        const normalized = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${normalized}"`;
      });
      
      // Clean up structure
      fixed = fixed
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":');
      
      return JSON.parse(fixed);
    },
    
    // Fix 5: Manual reconstruction
    () => {
      console.log('🔄 Enhanced修復試行 5');
      const files: Record<string, string> = {};
      
      // Extract files object with improved regex
      const filesMatch = jsonString.match(/"files"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (filesMatch) {
        const filesContent = filesMatch[0];
        
        // Extract each file with better pattern
        const filePattern = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        let match;
        
        while ((match = filePattern.exec(filesContent)) !== null) {
          const filename = match[1];
          let content = match[2];
          
          // Unescape content properly
          content = content
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          files[filename] = content;
        }
      }
      
      // Extract other fields
      const getField = (field: string): string => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
        const match = jsonString.match(regex);
        return match ? match[1] : '';
      };
      
      const getArray = (field: string): string[] => {
        const regex = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
        const match = jsonString.match(regex);
        if (match) {
          return match[1]
            .split(',')
            .map(s => s.trim().replace(/^["']|["']$/g, ''))
            .filter(s => s.length > 0);
        }
        return [];
      };
      
      return {
        files,
        description: getField('description') || 'コード改善完了',
        instructions: getField('instructions') || '改善されたコードです',
        framework: getField('framework') || 'vanilla',
        language: getField('language') || 'javascript',
        styling: getField('styling') || 'css',
        usedModel: getField('usedModel'),
        preservedFeatures: getArray('preservedFeatures'),
        improvements: getArray('improvements'),
        warnings: getArray('warnings')
      };
    }
  ];

  // Try each fix strategy
  let lastError: Error | null = null;
  for (let i = 0; i < fixes.length; i++) {
    try {
      const result = fixes[i]();
      
      // Validate result structure
      if (!result.files || typeof result.files !== 'object') {
        throw new Error('ファイル構造が無効');
      }
      
      // Process and ensure required files exist
      const processedFiles = { ...result.files };
      
      // Parse original code to extract existing files
      let existingFiles: Record<string, string> = {};
      if (originalCode) {
        try {
          const originalParsed = JSON.parse(originalCode);
          if (originalParsed.files) {
            existingFiles = originalParsed.files;
          }
        } catch {
          // If original code is not JSON, treat it as HTML
          if (originalCode.includes('<html') || originalCode.includes('<!DOCTYPE')) {
            existingFiles['index.html'] = originalCode;
          }
        }
      }
      
      // Merge existing files with new files (preserve existing content)
      Object.keys(existingFiles).forEach(filename => {
        if (!processedFiles[filename]) {
          processedFiles[filename] = existingFiles[filename];
        }
      });
      
      // Ensure required files exist to prevent 404 errors
      if (!processedFiles['index.html']) {
        processedFiles['index.html'] = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Improved App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>改善されたアプリケーション</h1>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
      }
      
      if (!processedFiles['script.js']) {
        processedFiles['script.js'] = `// Enhanced JavaScript functionality
console.log("App loaded successfully");

// 既存の機能を保護しながら新機能を追加
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - ready for enhancements');
});`;
      }
      
      if (!processedFiles['styles.css'] && !processedFiles['style.css']) {
        processedFiles['styles.css'] = `/* Enhanced styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`;
      }
      
      console.log('✅ Enhanced JSON解析成功');
      return {
        files: processedFiles,
        description: result.description || 'コード改善完了',
        instructions: result.instructions || '改善されたコードです',
        framework: result.framework || 'vanilla',
        language: result.language || 'javascript',
        styling: result.styling || 'css',
        usedModel: result.usedModel,
        preservedFeatures: result.preservedFeatures || [],
        improvements: result.improvements || [],
        warnings: result.warnings || []
      };
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ Enhanced修復試行 ${i + 1} 失敗:`, lastError.message);
    }
  }
  
  // If all fixes failed, throw error
  console.error('❌ Enhanced JSON処理失敗:', lastError);
  throw new Error(`JSON解析に失敗しました: ${lastError?.message || 'Unknown error'}`);
}

function createEnhancedFallbackResponse(
  originalCode: string, 
  improvementRequest: string, 
  framework: string, 
  model: string
): CodeGenerationResponse {
  // Try to preserve original code structure
  const hasHTML = originalCode.includes('<html') || originalCode.includes('<!DOCTYPE');
  const hasCSS = originalCode.includes('<style>') || originalCode.includes('.css');
  const hasJS = originalCode.includes('<script>') || originalCode.includes('function');

  const files: Record<string, string> = {};
  
  // Always include index.html
  files['index.html'] = hasHTML ? originalCode : `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>改善処理エラー</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>🔄 改善処理エラー</h1>
        <p>以下の改善要求の処理中にエラーが発生しました：</p>
        <div class="request">"${improvementRequest.substring(0, 100)}${improvementRequest.length > 100 ? '...' : ''}"</div>
        <p>より具体的で明確な改善要求で再試行してください。</p>
        <button onclick="window.parent.location.reload()">再試行</button>
        <button onclick="history.back()">戻る</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
  
  // Always include styles.css
  files['styles.css'] = `/* Enhanced error styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: white;
}

.container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 500px;
}

h1 {
    margin-bottom: 20px;
    font-size: 2rem;
}

p {
    margin-bottom: 15px;
    line-height: 1.6;
}

.request {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
    font-style: italic;
}

button {
    margin: 10px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
}`;
  
  // Always include script.js
  files['script.js'] = `// Enhanced error handling script
console.error('Code improvement failed');
console.log('Framework:', '${framework}');
console.log('Model:', '${model}');

// Debug information
window.debugInfo = {
    framework: '${framework}',
    model: '${model}',
    timestamp: new Date().toISOString(),
    originalCodeLength: ${originalCode ? originalCode.length : 0},
    improvementRequest: '${improvementRequest.substring(0, 100).replace(/'/g, "\\'")}'
};

// Error recovery functions
function retryImprovement() {
    window.parent.location.reload();
}

function goBack() {
    history.back();
}`;
  
  return {
    files,
    description: 'コード改善エラー - 再試行が必要です',
    instructions: 'より具体的な改善要求で再度お試しください',
    framework,
    language: 'javascript',
    styling: 'css',
    usedModel: model,
    preservedFeatures: [],
    improvements: [],
    warnings: ['改善処理中にエラーが発生しました']
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      originalCode, 
      improvementRequest, 
      framework = 'vanilla', 
      model = 'gemini-2.0-flash', 
      language = 'ja' 
    }: CodeImprovementRequest = req.body;

    if (!originalCode || !improvementRequest) {
      return res.status(400).json({ error: 'Original code and improvement request are required' });
    }

    console.log('🚀 Enhanced コード改善開始:', { 
      framework, 
      model, 
      language,
      requestLength: improvementRequest.length,
      codeLength: originalCode.length
    });

    const prompt = generateEnhancedImprovementPrompt(
      originalCode, 
      improvementRequest, 
      framework, 
      model, 
      language
    );
    
    let generatedText: string;
    if (model.includes('claude')) {
      generatedText = await callClaudeAPI(prompt, model);
    } else {
      throw new Error('Claude APIのみサポートされています');
    }

    if (!generatedText) {
      throw new Error('AIからのレスポンスが空です');
    }

    let result: CodeGenerationResponse;
    try {
      result = extractAndFixJSON(generatedText, originalCode);
    } catch (parseError) {
      console.error('❌ Enhanced JSON処理失敗:', parseError);
      console.error('❌ 問題のあるレスポンス (最初の500文字):', generatedText.substring(0, 500));
      result = createEnhancedFallbackResponse(originalCode, improvementRequest, framework, model);
    }
    
    console.log('✅ Enhanced コード改善完了:', {
      files: Object.keys(result.files || {}),
      framework: result.framework,
      model: result.usedModel || model,
      descriptionLength: result.description?.length || 0
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Enhanced コード改善エラー:', error);
    res.status(500).json({ 
      error: 'コード改善に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
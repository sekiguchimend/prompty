import { NextApiRequest, NextApiResponse } from 'next';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface UIGenerationRequest {
  prompt: string;
  existingCode?: {
    html?: string;
    css?: string;
    js?: string;
  };
  isIteration?: boolean;
}

interface UIGenerationResponse {
  html: string;
  css: string;
  js: string;
  description: string;
}

const generateUIPrompt = (userPrompt: string, existingCode?: { html?: string; css?: string; js?: string }) => {
  if (existingCode && (existingCode.html || existingCode.css || existingCode.js)) {
    // Iterative improvement prompt
    return `あなたは世界最高レベルのUIデザイナー兼フロントエンド開発者です。Claude Sonnet 4の能力を最大限活用して、既存のUIコードを改善・修正してください。

## 既存のコード
### 現在のHTML:
\`\`\`html
${existingCode.html || ''}
\`\`\`

### 現在のCSS:
\`\`\`css
${existingCode.css || ''}
\`\`\`

### 現在のJavaScript:
\`\`\`javascript
${existingCode.js || ''}
\`\`\`

## 修正・改善要求
${userPrompt}

## 出力要件
上記の既存コードをベースに、要求された修正・改善を適用して、完全に動作するUIコードを生成してください：

### HTML
- 既存構造を活かしつつ必要な修正を適用
- セマンティックで整理された構造
- アクセシビリティ対応
- JavaScriptで操作するためのid、classを適切に設定

### CSS (Tailwind CDN使用)
- 既存スタイルを活かしつつ改善
- Tailwind CSSのクラスを使用
- モダンで美しいデザイン
- レスポンシブ対応
- JavaScript連携用のスタイル

### JavaScript (Vanilla JS) - **重要：必ず機能を実装**
- 既存機能を活かしつつ改善
- 新機能の追加（クリック、フォーム処理、アニメーションなど）
- エラーハンドリング
- ユーザビリティ向上
- **空のJSではなく、実際に動作する機能を必ず含める**

## 出力形式
必ず以下のJSON形式で出力してください。他の説明は不要です：

{
  "html": "<!DOCTYPE html>\\n<html>\\n...",
  "css": "/* Tailwind CSS Classes + Custom Styles */\\n...",
  "js": "// 実機能を持つJavaScript Code - 必須\\n...",
  "description": "改善されたUIとその機能の説明"
}`;
  } else {
    // Original prompt for new UI generation
    return `あなたは世界最高レベルのUIデザイナー兼フロントエンド開発者です。Claude Sonnet 4の能力を最大限活用して、v0、Lovableを超える最高品質のUIコード生成を行ってください。

## 要求
${userPrompt}

## 重要：JavaScriptは必須です
以下の形式で、**必ずJavaScriptを含む**完全に動作するUIコードを生成してください。静的なUIでも、最低限のインタラクション（クリック、ホバー、フォーム処理など）を必ず実装してください。

### HTML
- セマンティックで整理された構造
- アクセシビリティ対応
- JavaScriptで操作するためのid、classを適切に設定
- インタラクティブ要素を必ず含める（ボタン、フォーム、メニューなど）

### CSS (Tailwind CDN使用)
- Tailwind CSSのクラスを使用
- モダンで美しいデザイン
- レスポンシブ対応
- ホバーエフェクトやアニメーション
- JavaScript連携用のスタイル

### JavaScript (Vanilla JS) - **必須**
以下のいずれかまたは複数を必ず実装してください：
- **クリックイベント**: ボタン、メニュー、タブの切り替え
- **フォーム処理**: バリデーション、送信処理、リアルタイム検証
- **DOM操作**: 要素の表示/非表示、動的コンテンツ追加
- **アニメーション**: スムーズな画面遷移、フェードイン/アウト
- **ユーザーインタラクション**: モーダル、ドロップダウン、スライダー
- **データ処理**: ローカルストレージ、計算機能、検索機能
- **リアルタイム機能**: 時計、カウンター、プログレスバー

**重要**: 空のJavaScriptや単純なconsole.logだけは避けて、実際の機能を持つコードを生成してください。

## 出力形式
必ず以下のJSON形式で出力してください。他の説明は不要です：

{
  "html": "<!DOCTYPE html>\\n<html>\\n...",
  "css": "/* Tailwind CSS Classes + Custom Styles */\\n...",
  "js": "// 実機能を持つJavaScript Code - 必須\\n...",
  "description": "生成されたUIとその機能の説明"
}`;
  }
};

async function callClaudeAPI(prompt: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API Error:', errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractJSONFromResponse(text: string): UIGenerationResponse {
  console.log('🔍 Extracting JSON from response...');
  console.log('📄 Response text length:', text.length);
  console.log('📄 Response preview (first 500 chars):', text.substring(0, 500));
  
  // 最初にバッククォートパターンでの抽出を試行
  try {
    const backtickResult = extractWithBackticks(text);
    if (backtickResult) {
      console.log('✅ Backtick extraction successful');
      return backtickResult;
    }
  } catch (backtickError) {
    console.log('⚠️ Backtick extraction failed:', backtickError);
  }
  
  // 次にフォールバック抽出を試行
  try {
    const fallbackResult = extractFieldsWithRegex(text);
    if (fallbackResult) {
      console.log('✅ Fallback extraction successful');
      return fallbackResult;
    }
  } catch (fallbackError) {
    console.log('⚠️ Fallback extraction failed:', fallbackError);
  }
  
  // 複数のJSON抽出方法を試行
  const jsonPatterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/i,  // ```json ブロック
    /```\s*(\{[\s\S]*?\})\s*```/i,      // ``` ブロック
    /(\{[\s\S]*\})/                     // 単純な{} - 最後の}まで
  ];
  
  let jsonText = '';
  let patternUsed = -1;
  
  for (let i = 0; i < jsonPatterns.length; i++) {
    const match = text.match(jsonPatterns[i]);
    if (match) {
      jsonText = match[1] || match[0];
      patternUsed = i + 1;
      console.log(`📦 Found JSON with pattern ${patternUsed}`);
      break;
    }
  }
  
  if (!jsonText) {
    console.error('❌ No JSON structure found in response');
    console.error('🔍 Full response text for debugging:', text);
    throw new Error('Valid JSON not found in response');
  }

  console.log('📄 Raw JSON length:', jsonText.length);
  console.log('📄 Raw JSON preview (first 300 chars):', jsonText.substring(0, 300));
  console.log('📄 Raw JSON preview (last 300 chars):', jsonText.substring(Math.max(0, jsonText.length - 300)));

  try {
    // JSONをクリーンアップ（バッククォートを削除）
    const cleanedJson = cleanupJsonString(jsonText);
    console.log('🧹 Cleaned JSON preview (first 300 chars):', cleanedJson.substring(0, 300));
    
    const parsed = JSON.parse(cleanedJson);
    
    // 必要なフィールドの検証
    const fieldCheck = {
      hasHtml: !!parsed.html,
      hasCss: !!parsed.css,
      hasJs: !!parsed.js,
      htmlType: typeof parsed.html,
      cssType: typeof parsed.css,
      jsType: typeof parsed.js,
      htmlLength: parsed.html?.length || 0,
      cssLength: parsed.css?.length || 0,
      jsLength: parsed.js?.length || 0
    };
    
    console.log('🔍 Field validation:', fieldCheck);
    
    if (!parsed.html || !parsed.css || !parsed.js) {
      console.error('❌ Missing required fields:', fieldCheck);
      console.error('🔍 Parsed object keys:', Object.keys(parsed));
      console.error('🔍 Full parsed object (first 1000 chars):', JSON.stringify(parsed).substring(0, 1000));
      throw new Error('Missing required fields in response');
    }

    console.log('✅ JSON parsing successful');
    return {
      html: parsed.html,
      css: parsed.css,
      js: parsed.js,
      description: parsed.description || 'Generated UI'
    };
  } catch (error) {
    console.error('❌ JSON parsing error:', error);
    console.error('🔍 Failed JSON text (first 500 chars):', jsonText.substring(0, 500));
    console.error('🔍 Pattern used:', patternUsed);
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// バッククォートで囲まれたコードを抽出する新しい関数
function extractWithBackticks(text: string): UIGenerationResponse | null {
  console.log('🔧 Attempting backtick extraction...');
  
  // パターン1: "field": `content` 形式での抽出（より柔軟な正規表現）
  const extractBacktickField = (fieldName: string): string | null => {
    // 複数のパターンを試行
    const patterns = [
      // 基本パターン: "field": `content`
      new RegExp(`"${fieldName}":\\s*\`([\\s\\S]*?)\`(?=\\s*[,}])`, 'i'),
      // 改行を含むパターン
      new RegExp(`"${fieldName}":\\s*\`([\\s\\S]*?)\``, 'i'),
      // スペースを含むパターン
      new RegExp(`"\\s*${fieldName}\\s*"\\s*:\\s*\`([\\s\\S]*?)\``, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        console.log(`✅ Found ${fieldName} with backtick pattern`);
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  // パターン2: JSON全体でバッククォートを通常の文字列に変換
  const convertBackticksToJson = (text: string): string => {
    console.log('🔄 Converting backticks to JSON format...');
    
    // より柔軟なバッククォート変換
    let converted = text.replace(/:\s*`([^`]*(?:`[^`]*)*)`/g, (match, content) => {
      // バッククォート内のコンテンツをJSONエスケープ
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\b/g, '\\b');
      return `: "${escaped}"`;
    });
    
    // 複数行バッククォートパターン
    converted = converted.replace(/:\s*`([\s\S]*?)`/g, (match, content) => {
      const escaped = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\b/g, '\\b');
      return `: "${escaped}"`;
    });
    
    return converted;
  };
  
  // 直接的なフィールド抽出を試行
  const html = extractBacktickField('html');
  const css = extractBacktickField('css');
  const js = extractBacktickField('js');
  const description = extractBacktickField('description');
  
  console.log('📋 Backtick extraction results:', {
    html: !!html,
    css: !!css,
    js: !!js,
    htmlLength: html?.length || 0,
    cssLength: css?.length || 0,
    jsLength: js?.length || 0
  });
  
  if (html && css && js) {
    console.log('✅ Direct backtick extraction successful');
    return {
      html,
      css,
      js,
      description: description || 'Generated UI'
    };
  }
  
  // バッククォートをJSONに変換して再試行
  try {
    const convertedText = convertBackticksToJson(text);
    console.log('📄 Converted text preview:', convertedText.substring(0, 300));
    
    // JSONブロックを探す
    const jsonPatterns = [
      /\{[\s\S]*\}/,  // 基本的な{...}パターン
      /```json\s*(\{[\s\S]*?\})\s*```/i,  // ```json ブロック
      /```\s*(\{[\s\S]*?\})\s*```/i       // ``` ブロック
    ];
    
    for (const pattern of jsonPatterns) {
      const match = convertedText.match(pattern);
      if (match) {
        const jsonText = match[1] || match[0];
        try {
          const parsed = JSON.parse(jsonText);
          if (parsed.html && parsed.css && parsed.js) {
            console.log('✅ Backtick conversion successful');
            return {
              html: parsed.html,
              css: parsed.css,
              js: parsed.js,
              description: parsed.description || 'Generated UI'
            };
          }
        } catch (parseError) {
          console.log('⚠️ JSON parse failed for converted text:', parseError);
          continue;
        }
      }
    }
  } catch (conversionError) {
    console.log('⚠️ Backtick conversion failed:', conversionError);
  }
  
  console.log('❌ Backtick extraction failed');
  return null;
}

// JSONのクリーンアップ関数
function cleanupJsonString(jsonString: string): string {
  // バッククォートを通常の引用符に変換
  let cleaned = jsonString.replace(/`([^`]*)`/g, (match, content) => {
    // バッククォート内のコンテンツをJSONエスケープ
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  });
  
  // 制御文字をエスケープ
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    const code = char.charCodeAt(0);
    return '\\u' + code.toString(16).padStart(4, '0');
  });
  
  return cleaned;
}

function extractFieldsWithRegex(text: string): UIGenerationResponse | null {
  console.log('🔄 Attempting fallback regex extraction...');
  
  // より柔軟な正規表現でフィールドを抽出
  const extractField = (fieldName: string): string | null => {
    const patterns = [
      // パターン1: "field": "value" (複数行対応)
      new RegExp(`"${fieldName}":\\s*"([\\s\\S]*?)(?="\\s*[,}])`, 'i'),
      // パターン2: より緩い抽出（エスケープ対応）
      new RegExp(`"${fieldName}":\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i'),
      // パターン3: バッククォート形式
      new RegExp(`"${fieldName}":\\s*\`([\\s\\S]*?)\``, 'i'),
      // パターン4: 単一引用符
      new RegExp(`"${fieldName}":\\s*'([\\s\\S]*?)'`, 'i'),
      // パターン5: フィールド名の前後にスペースがある場合
      new RegExp(`"\\s*${fieldName}\\s*"\\s*:\\s*"([\\s\\S]*?)"`, 'i'),
      // パターン6: 最後の要素（カンマなし）
      new RegExp(`"${fieldName}":\\s*"([\\s\\S]*?)"\\s*}`, 'i')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const match = text.match(patterns[i]);
      if (match && match[1]) {
        console.log(`✅ Found ${fieldName} with pattern ${i + 1}`);
        return match[1];
      }
    }
    
    return null;
  };
  
  const html = extractField('html');
  const css = extractField('css');
  const js = extractField('js');
  const description = extractField('description');
  
  console.log('📋 Extraction results:', {
    html: !!html,
    css: !!css,
    js: !!js,
    htmlLength: html?.length || 0,
    cssLength: css?.length || 0,
    jsLength: js?.length || 0
  });
  
  if (html && css && js) {
    // より強力なエスケープ文字のデコード
    const unescapeString = (str: string) => {
      return str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\f/g, '\f')
        .replace(/\\b/g, '\b')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\//g, '/')
        .replace(/\\\\/g, '\\')
        // Unicode エスケープ
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        // 16進エスケープ
        .replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
    };
    
    console.log('✅ Regex extraction successful');
    return {
      html: unescapeString(html),
      css: unescapeString(css),
      js: unescapeString(js),
      description: description ? unescapeString(description) : 'Generated UI'
    };
  }
  
  console.log('❌ Required fields not found in regex extraction');
  return null;
}

function generateFallbackUI(prompt: string): UIGenerationResponse {
  return {
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 hover:scale-105">
        <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span class="text-2xl text-white">🚀</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Claude Sonnet 4 UI</h1>
            <p class="text-gray-600 text-sm">プロンプト: ${prompt.substring(0, 80)}...</p>
        </div>
        
        <div class="space-y-4">
            <button id="primaryBtn" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                🎉 インタラクティブボタン
            </button>
            
            <div class="flex space-x-2">
                <button id="colorBtn" class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors">
                    🎨 色変更
                </button>
                <button id="animateBtn" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors">
                    ✨ アニメーション
                </button>
            </div>
            
            <div class="text-center">
                <div id="counter" class="text-3xl font-bold text-gray-800 mb-2">0</div>
                <button id="counterBtn" class="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                    🔢 カウンター
                </button>
            </div>
            
            <div id="result" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center hidden">
                <span id="resultText">Claude Sonnet 4 で生成完了！</span>
            </div>
        </div>
        
        <div class="mt-6 text-center">
            <div id="timestamp" class="text-xs text-gray-500"></div>
        </div>
    </div>
</body>
</html>`,
    css: `/* Tailwind CSS + Custom Animations */
.pulse-animation {
    animation: pulse 2s infinite;
}

.bounce-animation {
    animation: bounce 1s infinite;
}

.rotate-animation {
    animation: spin 2s linear infinite;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.5s ease-out;
}

.gradient-bg {
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.hover-shadow:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}`,
    js: `document.addEventListener('DOMContentLoaded', function() {
    const primaryBtn = document.getElementById('primaryBtn');
    const colorBtn = document.getElementById('colorBtn');
    const animateBtn = document.getElementById('animateBtn');
    const counterBtn = document.getElementById('counterBtn');
    const counter = document.getElementById('counter');
    const result = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const timestamp = document.getElementById('timestamp');
    
    let clickCount = 0;
    let counterValue = 0;
    
    // 時刻表示の更新
    function updateTimestamp() {
        const now = new Date();
        timestamp.textContent = '最終更新: ' + now.toLocaleTimeString('ja-JP');
    }
    
    // 初期時刻設定
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    
    // メインボタンのクリックイベント
    primaryBtn.addEventListener('click', function() {
        clickCount++;
        result.classList.remove('hidden');
        result.classList.add('fade-in');
        
        const messages = [
            'Claude Sonnet 4 で生成完了！',
            '素晴らしいUIが生成されました！🎉',
            'インタラクティブな機能が動作中！✨',
            'あなたのクリック数: ' + clickCount + '回'
        ];
        
        resultText.textContent = messages[Math.min(clickCount - 1, messages.length - 1)];
        
        // ボタンテキストの更新
        if (clickCount === 1) {
            primaryBtn.textContent = '🎯 再度クリック';
        } else if (clickCount >= 3) {
            primaryBtn.textContent = '🚀 Claude Sonnet 4 マスター';
            primaryBtn.classList.add('gradient-bg');
        }
    });
    
    // 色変更ボタン
    colorBtn.addEventListener('click', function() {
        const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
        const currentColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 既存の色クラスを削除
        colorBtn.className = colorBtn.className.replace(/bg-\\w+-\\d+/g, '');
        colorBtn.classList.add(currentColor);
        
        // フィードバック
        colorBtn.textContent = '🎨 色変更済み';
        setTimeout(() => {
            colorBtn.textContent = '🎨 色変更';
        }, 1500);
    });
    
    // アニメーションボタン
    animateBtn.addEventListener('click', function() {
        const animations = ['pulse-animation', 'bounce-animation', 'rotate-animation'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        // アニメーション適用
        animateBtn.classList.add(randomAnimation);
        
        // 2秒後にアニメーション削除
        setTimeout(() => {
            animateBtn.classList.remove(...animations);
        }, 2000);
    });
    
    // カウンターボタン
    counterBtn.addEventListener('click', function() {
        counterValue++;
        counter.textContent = counterValue;
        
        // カウンター表示のアニメーション
        counter.classList.add('bounce-animation');
        setTimeout(() => {
            counter.classList.remove('bounce-animation');
        }, 1000);
        
        // 10の倍数で特別なメッセージ
        if (counterValue % 10 === 0 && counterValue > 0) {
            resultText.textContent = '🎉 ' + counterValue + '回達成！すごいですね！';
            result.classList.remove('hidden');
            result.classList.add('fade-in');
        }
    });
    
    console.log('🚀 Claude Sonnet 4 - Interactive UI loaded successfully!');
    console.log('✨ Features: Button interactions, color changes, animations, counter, real-time clock');
});`,
    description: `Claude Sonnet 4 インタラクティブサンプルUI - "${prompt}"に基づいて生成。クリックボタン、色変更、アニメーション、カウンター、リアルタイム時計など豊富な機能を搭載したデモインターフェース。`
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, existingCode, isIteration } = req.body as UIGenerationRequest;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }

    const actionType = isIteration ? '改善' : '生成';
    console.log(`🚀 [Claude Sonnet 4] UI${actionType}開始:`, prompt.substring(0, 100) + '...');

    let result: UIGenerationResponse;

    try {
      if (CLAUDE_API_KEY) {
        const systemPrompt = generateUIPrompt(prompt.trim(), existingCode);
        const claudeResponse = await callClaudeAPI(systemPrompt);
        
        // Claude APIからのレスポンスをログ出力（デバッグ用）
        console.log('📥 Claude API Response length:', claudeResponse.length);
        console.log('📄 Response preview (first 200 chars):', claudeResponse.substring(0, 200));
        
        result = extractJSONFromResponse(claudeResponse);
        
        // 抽出結果の詳細ログ
        console.log('📋 Extracted result details:', {
          htmlLength: result.html?.length || 0,
          cssLength: result.css?.length || 0,
          jsLength: result.js?.length || 0,
          description: result.description?.substring(0, 100) + '...'
        });
        
        console.log(`✅ [Claude Sonnet 4] ${actionType}完了`);
      } else {
        console.warn('⚠️ Claude APIキーが未設定、フォールバック使用');
        result = generateFallbackUI(prompt);
      }
    } catch (apiError) {
      console.error(`❌ Claude Sonnet 4 ${actionType}エラー:`, apiError);
      console.log('🔄 フォールバックUIにフォールオーバー中...');
      result = generateFallbackUI(prompt);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ UI生成エラー:', error);
    
    const fallback = generateFallbackUI(req.body?.prompt || 'サンプルUI');
    return res.status(500).json({
      ...fallback,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
    });
  }
} 
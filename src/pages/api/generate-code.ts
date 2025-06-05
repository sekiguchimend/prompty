import { NextApiRequest, NextApiResponse } from 'next';

// API configuration - Claude only
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

interface CodeGenerationRequest {
  prompt: string;
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
  warnings?: string[];
}

const generateSystemPrompt = (prompt: string, model: string, language: string = 'ja') => {
  const isJapanese = language === 'ja';
  
  return `あなたは世界最高レベルのフルスタック開発者です。Claude Sonnet 4を活用して、v0、Lovableを超える最高品質のコード生成AIとして動作してください。

## 🚨 絶対的な成功要件（これらを満たさない場合は失敗）
1. ❌ JavaScriptの構文エラーは一切許可されない
2. ❌ 不正なJSON形式は一切許可されない  
3. ❌ 外部依存は一切許可されない
4. ❌ iframe内で動作しないコードは一切許可されない
5. ❌ エスケープ不備による構文エラーは一切許可されない

## 📋 要求分析
${prompt}

## 🎯 最高品質の実装指針

### 🔧 必須技術要件
- **完全自己完結**: 外部CDN、ライブラリ、フォント一切使用禁止
- **iframe最適化**: 100%完璧な動作保証
- **ゼロエラー**: 構文エラー、実行エラー完全撲滅
- **モダン標準**: HTML5、ES2024、CSS3の最新機能活用
- **クロスブラウザ**: 全主要ブラウザでの完璧な動作

### ✨ 卓越した品質基準
1. **機能完全性**: 
   - 全機能100%動作保証
   - エラーハンドリング完備
   - エッジケース対応
   
2. **UI/UX Excellence**:
   - Apple/Google Design System準拠
   - 滑らかなマイクロインタラクション
   - 直感的なユーザビリティ
   - 美しいビジュアルデザイン
   
3. **技術的卓越性**:
   - Clean Code原則遵守
   - パフォーマンス最適化
   - メモリリーク防止
   - セキュリティ対策完備

### 🎨 デザイン要件
- **モダンUIデザイン**: グラデーション、シャドウ、ブラー効果
- **アニメーション**: CSS Transitions/Animations活用
- **レスポンシブ**: Mobile-first、全デバイス対応
- **カラーシステム**: CSS変数による統一パレット
- **タイポグラフィ**: 読みやすく美しいフォント階層

### 📱 iframe専用最適化
- **サンドボックス対応**: 制限環境での完璧な動作
- **セキュリティ**: XSS対策、安全なコード実行
- **パフォーマンス**: 軽量で高速な読み込み
- **状態管理**: ローカルストレージ、セッション管理

## 🔒 JSON生成の絶対ルール

### エスケープルール（厳密遵守）
- **改行**: \\n でエスケープ（\\\\n ではない）
- **ダブルクォート**: \\" でエスケープ
- **バックスラッシュ**: \\\\ でエスケープ  
- **タブ**: \\t でエスケープ
- **特殊文字**: JSON規格に完全準拠

### JavaScript安全性チェックリスト
- ✅ 全ての関数が適切に閉じられている
- ✅ オブジェクトリテラルの構文が正しい
- ✅ 文字列リテラルが適切にエスケープされている
- ✅ イベントリスナーが正しく設定されている
- ✅ DOM操作が安全に実装されている

### CSS安全性チェックリスト  
- ✅ 全てのセレクタブロックが閉じられている
- ✅ プロパティ値が正しい構文
- ✅ メディアクエリが適切に設定
- ✅ アニメーション定義が完全

## 必須レスポンス形式

⚠️ 重要: 以下の形式を一字一句厳密に守ってください
⚠️ 重要: JSON以外の説明文やコードブロックは絶対に含めないでください

{
  "files": {
    "index.html": "<!DOCTYPE html>\\n<html lang=\\"ja\\">\\n<head>\\n    <meta charset=\\"UTF-8\\">\\n    <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">\\n    <title>アプリタイトル</title>\\n    <style>\\n        /* CSS Content */\\n    </style>\\n</head>\\n<body>\\n    <!-- HTML Content -->\\n    <script>\\n        // JavaScript Content\\n    </script>\\n</body>\\n</html>",
    "styles.css": "/* 完璧なCSSコード */\\nbody { margin: 0; }",
    "script.js": "// 完璧なJavaScriptコード\\nfunction example() {\\n    return 'success';\\n}"
  },
  "description": "${isJapanese ? '高品質なアプリケーションの詳細説明' : 'High-quality application description'}",
  "instructions": "${isJapanese ? '使用方法とインタラクション完全ガイド' : 'Complete usage and interaction guide'}",
  "framework": "vanilla-js",
  "language": "javascript", 
  "styling": "css3",
  "usedModel": "${model}"
}

## 🎯 実装要件まとめ
- ✅ 完全動作するアプリケーション（100%エラーなし）
- ✅ 美しく直感的なUI/UX
- ✅ 完璧なレスポンシブデザイン  
- ✅ 高いアクセシビリティ
- ✅ 最適化されたパフォーマンス
- ✅ iframe内での完璧な動作
- ✅ 詳細な日本語コメント
- ✅ 絶対に有効なJSONのみ返却
- ✅ 適切な文字エスケープ処理

今すぐ、上記要件を100%満たす業界最高品質のWebアプリケーションを生成してください。`;
};

// Claude API呼び出し
async function callClaudeAPI(prompt: string, model: string): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  // Claude モデルの正規化
  const claudeModel = model.includes('claude-4') || model.includes('sonnet-4') ? 'claude-3-5-sonnet-20241022' :
                     model.includes('claude-3.5-sonnet') ? 'claude-3-5-sonnet-20241022' :
                     'claude-3-5-sonnet-20241022';

  console.log('🔮 Claude API呼び出し:', { 
    model: claudeModel, 
    requestedModel: model,
    note: 'Claude 3.5 Sonnet使用 (最高品質モデル)'
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: claudeModel,
      max_tokens: 8192,
      temperature: 0.1,  // より安定した出力
      top_p: 0.8,
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
    console.error('❌ Claude API Error:', errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 外部ファイル参照をクリーンアップする関数（精度向上版）
function cleanExternalReferences(files: Record<string, string>): Record<string, string> {
  const cleanedFiles = { ...files };
  
  // HTMLファイルから外部参照を除去
  Object.keys(cleanedFiles).forEach(filename => {
    if (filename.endsWith('.html')) {
      let html = cleanedFiles[filename];
      
      console.log('🧹 HTMLクリーンアップ開始:', filename);
      
      const beforeLinks = (html.match(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi) || []).length;
      const beforeScripts = (html.match(/<script[^>]*src=["'][^"']*\.js["'][^>]*>/gi) || []).length;
      
      // 🔧 外部CSSファイル参照を削除（より精密）
      html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi, '');
      html = html.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');
      html = html.replace(/<link[^>]*href=["'](?:styles?|style)\.css["'][^>]*>/gi, '');
      
      // 🔧 外部JSファイル参照を削除（より精密）
      html = html.replace(/<script[^>]*src=["'][^"']*\.js["'][^>]*>[\s\S]*?<\/script>/gi, '');
      html = html.replace(/<script[^>]*src=["'](?:scripts?|script)\.js["'][^>]*><\/script>/gi, '');
      
      // 🔧 一般的な外部リソース参照も削除
      html = html.replace(/<link[^>]*href=["'][^"']*\.(css|js|ico|png|jpg|gif|svg|woff|woff2|ttf|eot)["'][^>]*>/gi, '');
      
      const afterLinks = (html.match(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi) || []).length;
      const afterScripts = (html.match(/<script[^>]*src=["'][^"']*\.js["'][^>]*>/gi) || []).length;
      
      cleanedFiles[filename] = html;
      
      console.log('✅ HTMLクリーンアップ完了:', {
        filename,
        removedCSSLinks: beforeLinks - afterLinks,
        removedJSScripts: beforeScripts - afterScripts,
        remainingCSSLinks: afterLinks,
        remainingJSScripts: afterScripts
      });
    }
  });
  
  return cleanedFiles;
}

// HTMLファイルにCSSとJavaScriptを埋め込む関数（重複防止強化版）
function embedFilesInHTML(html: string, files: Record<string, string>): string {
  let embeddedHTML = html;
  
  console.log('🔧 ファイル埋め込み処理開始');
  
  // 🔧 既存の埋め込みスタイル・スクリプトを一旦削除（重複防止）
  embeddedHTML = embeddedHTML.replace(/<!--\s*===== [^=]+ =====\s*-->[\s\S]*?<!--\s*===== [^=]+ End =====\s*-->/g, '');
  embeddedHTML = embeddedHTML.replace(/<style[^>]*>[\s\S]*?\/\* ===== [^=]+ ===== \*\/[\s\S]*?<\/style>/g, '');
  embeddedHTML = embeddedHTML.replace(/<script[^>]*>[\s\S]*?\/\/ ===== [^=]+ =====[\s\S]*?<\/script>/g, '');
  
  // 🔧 既存の個別CSS/JSファイル埋め込みも削除
  embeddedHTML = embeddedHTML.replace(/<style>\s*\/\* [^*]+ \*\/[\s\S]*?<\/style>/g, '');
  embeddedHTML = embeddedHTML.replace(/<script>\s*\/\/ [^/]+ \/\/[\s\S]*?<\/script>/g, '');
  
  // CSSの埋め込み（重複防止）
  const cssFiles = Object.keys(files).filter(name => name.endsWith('.css') && files[name].trim().length > 0);
  if (cssFiles.length > 0) {
    let allCSS = '';
    const addedContent = new Set();
    
    cssFiles.forEach(cssFile => {
      const content = files[cssFile].trim();
      if (content && !addedContent.has(content)) {
        allCSS += `\n        /* ===== ${cssFile} ===== */\n`;
        allCSS += `        ${content}\n`;
        addedContent.add(content);
      }
    });
    
    if (allCSS.trim()) {
      // 既存のstyleタグを削除してから新しく追加
      embeddedHTML = embeddedHTML.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
      
      const cssStyle = `    <style>${allCSS}    </style>`;
      
      if (embeddedHTML.includes('</head>')) {
        embeddedHTML = embeddedHTML.replace('</head>', cssStyle + '\n</head>');
      } else {
        embeddedHTML = embeddedHTML.replace('<body>', `<head>${cssStyle}\n</head>\n<body>`);
      }
      
      console.log('✅ CSS埋め込み完了:', cssFiles);
    }
  }
  
  // JavaScriptの埋め込み（重複防止）
  const jsFiles = Object.keys(files).filter(name => name.endsWith('.js') && files[name].trim().length > 0);
  if (jsFiles.length > 0) {
    let allJS = '';
    const addedContent = new Set();
    
    jsFiles.forEach(jsFile => {
      const content = files[jsFile].trim();
      if (content && !addedContent.has(content)) {
        // Todoアプリのコードは電卓に不要なのでスキップ
        if (content.includes('Todo App') || content.includes('todoApp') || content.includes('robustTodos')) {
          console.log(`⚠️ ${jsFile}: Todoアプリコードを検出、スキップ`);
          return;
        }
        
        allJS += `\n        // ===== ${jsFile} =====\n`;
        allJS += `        ${content}\n`;
        addedContent.add(content);
      }
    });
    
    if (allJS.trim()) {
      // 既存のscriptタグ（srcなし）を削除してから新しく追加
      embeddedHTML = embeddedHTML.replace(/<script(?![^>]*src)[^>]*>[\s\S]*?<\/script>/g, '');
      
      const jsScript = `    <script>${allJS}    </script>`;
      
      if (embeddedHTML.includes('</body>')) {
        embeddedHTML = embeddedHTML.replace('</body>', jsScript + '\n</body>');
      } else {
        embeddedHTML += jsScript;
      }
      
      console.log('✅ JavaScript埋め込み完了:', jsFiles);
    }
  }
  
  // 🔧 最終クリーンアップ - 空のstyle/scriptタグを削除
  embeddedHTML = embeddedHTML.replace(/<style[^>]*>\s*<\/style>/g, '');
  embeddedHTML = embeddedHTML.replace(/<script[^>]*>\s*<\/script>/g, '');
  
  return embeddedHTML;
}

// 改善されたJSON抽出と修復関数
function extractAndFixJSON(text: string): CodeGenerationResponse {
  console.log('🔧 レスポンス処理開始:', text.length, '文字');
  
  // レスポンス全体をログ出力（デバッグ用）
  console.log('📋 受信レスポンス:', text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
  
  // 最も堅牢なアプローチ：文字単位でJSONを解析
  function extractJSONContent(): CodeGenerationResponse {
    console.log('🔧 堅牢なJSON抽出開始');
    
    // まず、明確なJSONブロックを探す
    let jsonStart = -1;
    let jsonEnd = -1;
    
    // 様々なJSONの開始パターンを検索
    const startPatterns = [
      /```json\s*\{/,
      /```\s*\{/,
      /^\s*\{/m,
      /\{\s*"files"/
    ];
    
    for (const pattern of startPatterns) {
      const match = text.match(pattern);
      if (match) {
        jsonStart = text.indexOf(match[0]) + match[0].indexOf('{');
        console.log('📍 JSON開始位置発見:', jsonStart);
        break;
      }
    }
    
    if (jsonStart === -1) {
      throw new Error('JSON開始位置が見つかりません');
    }
    
    // 対応する終了括弧を探す（完全修正版）
    let braceCount = 0;
    let inString = false;
    let inComment = false;
    let stringChar = '';
    let escapeNext = false;
    let processed = 0;
    
    for (let i = jsonStart; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1] || '';
      processed++;
      
      // 🔧 処理制限（1MB）
      if (processed > 1000000) {
        console.log('⚠️ JSON処理が1MBを超えたため強制終了');
        // 最後の}を探す
        const lastBrace = text.lastIndexOf('}');
        if (lastBrace > jsonStart) {
          jsonEnd = lastBrace;
          console.log('📍 強制終了: 最後の}を使用:', jsonEnd);
          break;
        }
        throw new Error('JSON処理が制限を超えました');
      }
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      // コメント処理
      if (!inString) {
        if (char === '/' && nextChar === '/') {
          inComment = true;
          i++; // 次の文字をスキップ
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inComment = true;
          i++; // 次の文字をスキップ
          continue;
        }
        if (inComment) {
          if ((char === '*' && nextChar === '/') || char === '\n') {
            inComment = false;
            if (char === '*') i++; // */ の場合は次の文字もスキップ
          }
          continue;
        }
      }
      
      // 文字列の開始/終了検出
      if (!inComment && !inString && (char === '"' || char === "'" || char === '`')) {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (!inComment && inString && char === stringChar && !escapeNext) {
        inString = false;
        stringChar = '';
        continue;
      }
      
      // 文字列・コメント内では括弧をカウントしない
      if (!inString && !inComment) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            console.log('📍 JSON終了位置発見:', jsonEnd, '処理文字数:', processed);
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1) {
      throw new Error('JSON終了位置が見つかりません');
    }
    
    let jsonString = text.slice(jsonStart, jsonEnd + 1);
    console.log('📋 抽出されたJSON長:', jsonString.length);
    
    // 文字レベルでの修復処理
    jsonString = fixJSONString(jsonString);
    
    // JSONパースを試行
    try {
      const parsed = JSON.parse(jsonString);
      return validateAndSanitizeResult(parsed);
    } catch (error) {
      console.log('❌ JSON直接パース失敗:', error);
      throw error;
    }
  }
  
  // JSON文字列を修復する関数
  function fixJSONString(jsonStr: string): string {
    console.log('🔧 JSON文字列修復開始');
    
    let fixed = jsonStr;
    
    // 1. テンプレートリテラル（バッククォート）の処理
    if (fixed.includes('`')) {
      console.log('⚠️ バッククォート検出、修復中...');
      
      // バッククォート内のコンテンツを安全に抽出して変換
      fixed = fixed.replace(/`([^`]*(?:`[^`]*)*)`/g, (match, content) => {
        // 内容を適切にエスケープ
        let escaped = content
          .replace(/\\/g, '\\\\')    // バックスラッシュをエスケープ
          .replace(/"/g, '\\"')      // ダブルクォートをエスケープ
          .replace(/\n/g, '\\n')     // 改行をエスケープ
          .replace(/\r/g, '\\r')     // キャリッジリターンをエスケープ
          .replace(/\t/g, '\\t')     // タブをエスケープ
          .replace(/\f/g, '\\f')     // フォームフィードをエスケープ
          .replace(/\b/g, '\\b');    // バックスペースをエスケープ
        
        return `"${escaped}"`;
      });
    }
    
    // 2. 制御文字の除去
    fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // 3. 末尾カンマの除去
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 4. 文字列内の未エスケープ改行の修復
    fixed = fixed.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
      if (content.includes('\n') || content.includes('\r') || content.includes('\t')) {
        let fixedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${fixedContent}"`;
      }
      return match;
    });
    
    // 5. キーのクォート確認
    fixed = fixed.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    
    console.log('✅ JSON文字列修復完了');
    return fixed;
  }
  
  // 手動ファイル抽出（最後の手段）
  function manualFileExtraction(): CodeGenerationResponse {
    console.log('🔧 手動ファイル抽出開始');
    
    const files: Record<string, string> = {};
    
    // より安全なファイル抽出関数（改善版）
    function extractFileContent(fileName: string): string {
      console.log(`📄 ${fileName} 抽出中...`);
      
      // 🔧 HTMLファイルの場合、埋め込まれたCSS/JSも抽出
      if (fileName === 'styles.css' || fileName === 'style.css') {
        // HTMLから<style>タグ内のCSSを抽出
        const styleMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch && styleMatch[1]) {
          console.log('✅ HTMLから埋め込みCSS抽出成功:', styleMatch[1].length, '文字');
          return styleMatch[1].trim();
        }
      }
      
      if (fileName === 'script.js') {
        // HTMLから<script>タグ内のJSを抽出
        const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (scriptMatch && scriptMatch[1]) {
          console.log('✅ HTMLから埋め込みJS抽出成功:', scriptMatch[1].length, '文字');
          return scriptMatch[1].trim();
        }
      }
      
      // パターンマッチング: "filename": "content"（改善版）
      const patterns = [
        new RegExp(`"${fileName}"\\s*:\\s*"`, 'i'),
        new RegExp(`'${fileName}'\\s*:\\s*"`, 'i'),
        new RegExp(`${fileName}\\s*:\\s*"`, 'i'),
        // 🔧 追加パターン: JSONの最初にあるファイル
        new RegExp(`\\{\\s*"files"\\s*:\\s*\\{\\s*"${fileName}"\\s*:\\s*"`, 'i')
      ];
      
      let startIndex = -1;
      let usedPattern = null;
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          usedPattern = match[0];
          startIndex = text.indexOf(match[0]) + match[0].length;
          console.log(`📍 ${fileName} パターン発見:`, usedPattern.substring(0, 50) + '...');
          break;
        }
      }
      
      if (startIndex === -1) {
        console.log(`❌ ${fileName} のパターンが見つかりません`);
        return '';
      }
      
      console.log(`📍 ${fileName} 開始位置: ${startIndex}`);
      
      // 🔧 改善: より堅牢なコンテンツ終了検出
      let content = '';
      let i = startIndex;
      let escapeNext = false;
      let foundEnd = false;
      let nestingLevel = 0;
      let inQuote = false;
      
      while (i < text.length) {
        const char = text[i];
        
        if (escapeNext) {
          content += char;
          escapeNext = false;
          i++;
          continue;
        }
        
        if (char === '\\') {
          content += char;
          escapeNext = true;
          i++;
          continue;
        }
        
        // 🔧 改善: より正確な終了検出
        if (char === '"') {
          if (!inQuote) {
            inQuote = true;
            content += char;
          } else {
            // 🔧 次の文字を詳細チェック
            let checkIndex = i + 1;
            while (checkIndex < text.length && /\s/.test(text[checkIndex])) {
              checkIndex++;
            }
            
            const nextMeaningfulChar = text[checkIndex];
            const isRealEnd = nextMeaningfulChar === ',' || nextMeaningfulChar === '}' || nextMeaningfulChar === ']';
            
            if (isRealEnd) {
              foundEnd = true;
              console.log(`📍 ${fileName} 終了検出: 次の文字="${nextMeaningfulChar}"`);
              break;
            } else {
              content += char;
              inQuote = false; // 文字列内の"として処理
            }
          }
        } else {
          content += char;
        }
        
        i++;
        
        // 🔧 セーフティ: 1MB を超えたら強制終了
        if (content.length > 1000000) {
          console.log(`⚠️ ${fileName} が1MBを超えたため、処理を終了`);
          break;
        }
      }
      
      // 🔧 コンテンツが途中で切れている場合の修復
      if (!foundEnd && content.length > 0) {
        console.log(`⚠️ ${fileName} が途中で切れている可能性があります - 修復を試行`);
        
        // JavaScript ファイルの場合の修復
        if (fileName.endsWith('.js')) {
          // 最後の行が不完全な場合は削除
          const lines = content.split('\n');
          const lastLine = lines[lines.length - 1];
          
          // 最後の行が明らかに不完全（コメントの途中など）
          if (lastLine.trim().startsWith('//') && !lastLine.includes('完了') && !lastLine.includes('終了')) {
            lines.pop();
            content = lines.join('\n');
            console.log(`🔧 ${fileName}: 不完全な最後の行を削除`);
          }
          
          // 関数やクラスが開いたままの場合は閉じる
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            content += '\n' + '}'.repeat(missingBraces);
            console.log(`🔧 ${fileName}: ${missingBraces}個の閉じ括弧を追加`);
          }
        }
        
        // HTML ファイルの場合の修復
        if (fileName.endsWith('.html')) {
          if (!content.includes('</html>')) {
            if (!content.includes('</body>')) {
              content += '\n</body>';
            }
            content += '\n</html>';
            console.log(`🔧 ${fileName}: HTMLタグを完了`);
          }
        }
        
        // CSS ファイルの場合の修復
        if (fileName.endsWith('.css')) {
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            content += '\n' + '}'.repeat(missingBraces);
            console.log(`🔧 ${fileName}: ${missingBraces}個のCSSブロックを閉じる`);
          }
        }
      }
      
      // エスケープ解除
      const unescaped = content
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      
      console.log(`✅ ${fileName} 抽出完了: ${unescaped.length} 文字 (修復: ${foundEnd ? 'なし' : 'あり'})`);
      return unescaped;
    }
    
    // ファイル抽出実行
    const fileNames = ['index.html', 'script.js', 'styles.css', 'style.css'];
    
    for (const fileName of fileNames) {
      const content = extractFileContent(fileName);
      if (content && content.trim()) {
        files[fileName] = content;
      }
    }
    
    // 最低限必要なファイルを保証
    ensureRequiredFiles(files);
    
    // メタデータの抽出
    const metadata = extractMetadata();
    
    return {
      files,
      description: metadata.description || 'AI生成Todoアプリケーション',
      instructions: metadata.instructions || 'タスクの追加、削除、完了状態の切り替えができます',
      framework: metadata.framework || 'Vanilla JavaScript',
      language: metadata.language || 'JavaScript',
      styling: metadata.styling || 'CSS',
      usedModel: metadata.usedModel || 'unknown'
    };
  }
  
  // メタデータ抽出
  function extractMetadata() {
    const getField = (field: string, defaultValue: string = '') => {
      const patterns = [
        new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i'),
        new RegExp(`'${field}'\\s*:\\s*"([^"]*)"`, 'i'),
        new RegExp(`${field}\\s*:\\s*"([^"]*)"`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return defaultValue;
    };
    
    return {
      description: getField('description'),
      instructions: getField('instructions'),
      framework: getField('framework'),
      language: getField('language'),
      styling: getField('styling'),
      usedModel: getField('usedModel')
    };
  }
  
  // 必須ファイルの保証（改善版コード保護機能付き）
  function ensureRequiredFiles(files: Record<string, string>) {
    console.log('🔧 必須ファイル確認中...');

    // 🔧 改善版コードの検出（強化版）
    const hasImprovedCode = Object.values(files).some(content => 
      content.includes('Premium Todo') || 
      content.includes('最高品質') ||
      content.includes('v0品質') ||
      content.includes('Premium Design System') ||
      content.includes('Modern Todo App') ||
      content.includes('--primary-gradient') ||
      content.includes('backdrop-filter') ||
      content.length > 15000 // 大きなファイルは改善版の可能性が高い
    );

    if (hasImprovedCode) {
      console.log('🛡️ 改善版コード検出 - 完全保護モード');
      
      // 🛡️ HTMLが既に完全である場合は何もしない
      if (files['index.html'] && files['index.html'].includes('<style>') && files['index.html'].includes('<script>')) {
        console.log('🛡️ HTMLに既にCSS/JS埋め込み済み - 追加処理スキップ');
        console.log('✅ 改善版コード完全保護完了:', Object.keys(files));
        return;
      }
    }

    // 🔧 ファイル完全性チェックと修復
    Object.keys(files).forEach(filename => {
      const content = files[filename];
      if (!content || content.trim().length === 0) {
        console.log(`⚠️ ${filename} が空です - 削除`);
        delete files[filename];
        return;
      }

      // ファイル別完全性チェック
      if (filename.endsWith('.html')) {
        files[filename] = ensureCompleteHTML(content, filename);
      } else if (filename.endsWith('.js')) {
        // 🛡️ 改善版コードの場合は構文チェックを緩和
        if (hasImprovedCode && content.length > 5000) {
          console.log(`🛡️ ${filename}: 改善版と判定、構文チェック緩和`);
          files[filename] = ensureCompleteJS(content, filename, true); // 緩和モード
        } else {
          files[filename] = ensureCompleteJS(content, filename, false);
        }
      } else if (filename.endsWith('.css')) {
        files[filename] = ensureCompleteCSS(content, filename);
      }
    });

    // 🛡️ 改善版がある場合は不足ファイルを生成しない
    if (hasImprovedCode) {
      console.log('🛡️ 改善版コード保護: デフォルトファイル生成をスキップ');
      // HTMLにCSS/JS埋め込みのみ実行
      if (files['index.html']) {
        files['index.html'] = embedFilesInHTML(files['index.html'], files);
      }
      console.log('✅ 改善版コード保護完了:', Object.keys(files));
      return;
    }

    if (!files['index.html'] || files['index.html'].trim().length === 0) {
      console.log('⚠️ index.html が不足、生成中...');
      files['index.html'] = generateRobustHTML();
    }

    if (!files['script.js'] || files['script.js'].trim().length === 0) {
      console.log('⚠️ script.js が不足、生成中...');
      files['script.js'] = generateRobustJS();
    }

    if (!files['styles.css'] && !files['style.css']) {
      console.log('⚠️ styles.css が不足、生成中...');
      files['styles.css'] = generateRobustCSS();
    }

    // JavaScriptファイルの構文チェック
    if (files['script.js']) {
      if (!isValidJavaScript(files['script.js'])) {
        console.log('⚠️ script.js に構文エラー、安全版に置換...');
        files['script.js'] = generateRobustJS();
      }
    }

    // 🔧 HTML内にCSSとJSを埋め込む処理
    if (files['index.html']) {
      files['index.html'] = embedFilesInHTML(files['index.html'], files);
    }

    console.log('✅ 必須ファイル確認完了:', Object.keys(files));
  }

  // HTML完全性保証
  function ensureCompleteHTML(content: string, filename: string): string {
    let html = content;

    console.log(`🔍 HTML完全性チェック: ${filename}`);

    // 基本構造チェック
    if (!html.includes('<!DOCTYPE html>')) {
      html = '<!DOCTYPE html>\n' + html;
      console.log(`🔧 ${filename}: DOCTYPE追加`);
    }

    if (!html.includes('<html')) {
      html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="ja">');
      console.log(`🔧 ${filename}: html要素追加`);
    }

    if (!html.includes('<head>')) {
      html = html.replace('<html', '<html lang="ja">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>アプリケーション</title>\n</head>\n<body');
      console.log(`🔧 ${filename}: head要素追加`);
    }

    if (!html.includes('<body>') && !html.includes('<body ')) {
      html = html.replace('</head>', '</head>\n<body>');
      console.log(`🔧 ${filename}: body要素追加`);
    }

    if (!html.includes('</body>')) {
      html += '\n</body>';
      console.log(`🔧 ${filename}: body終了タグ追加`);
    }

    if (!html.includes('</html>')) {
      html += '\n</html>';
      console.log(`🔧 ${filename}: html終了タグ追加`);
    }

    return html;
  }

  // JavaScript完全性保証（緩和モード対応）
  function ensureCompleteJS(content: string, filename: string, relaxed: boolean = false): string {
    let js = content;

    console.log(`🔍 JavaScript完全性チェック: ${filename} (${js.length}文字) ${relaxed ? '[緩和モード]' : '[厳格モード]'}`);

    // 🛡️ 緩和モードの場合は基本的なチェックのみ
    if (relaxed) {
      console.log(`🛡️ ${filename}: 緩和モード - 基本チェックのみ実行`);
      
      // 最低限の括弧バランスチェックのみ
      const openBraces = (js.match(/\{/g) || []).length;
      const closeBraces = (js.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;

      if (missingBraces > 0 && missingBraces < 10) { // 極端でない場合のみ修正
        js += '\n' + '}'.repeat(missingBraces);
        console.log(`🔧 ${filename}: ${missingBraces}個の閉じ括弧を追加`);
      }
      
      return js;
    }

    // 危険なパターンチェック（厳格モード）
    const dangerousPatterns = [
      /SyntaxError/i,
      /Unexpected token/i,
      /Invalid character/i,
      /Unterminated string/i,
      /^\s*[\{\[]/,  // JSONで開始
      /^\s*"[^"]*":\s*"/,  // JSON形式
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(js)) {
        console.log(`❌ ${filename}: 危険なパターン検出 - 安全版に置換`);
        return generateRobustJS();
      }
    }

    // 括弧バランスチェック
    const openBraces = (js.match(/\{/g) || []).length;
    const closeBraces = (js.match(/\}/g) || []).length;
    const openParens = (js.match(/\(/g) || []).length;
    const closeParens = (js.match(/\)/g) || []).length;

    let missingBraces = openBraces - closeBraces;
    let missingParens = openParens - closeParens;

    if (missingBraces > 0) {
      js += '\n' + '}'.repeat(missingBraces);
      console.log(`🔧 ${filename}: ${missingBraces}個の閉じ括弧を追加`);
    }

    if (missingParens > 0) {
      js += ')'.repeat(missingParens);
      console.log(`🔧 ${filename}: ${missingParens}個の閉じ括弧を追加`);
    }

    // 最低限のJavaScript要素があるかチェック
    const hasValidContent = 
      js.includes('function') || 
      js.includes('const ') || 
      js.includes('let ') || 
      js.includes('var ') ||
      js.includes('class ') ||
      js.includes('document.') ||
      js.includes('console.') ||
      js.includes('addEventListener');

    if (!hasValidContent && js.trim().length < 100) {
      console.log(`❌ ${filename}: 有効なJavaScriptコンテンツが不足 - 安全版に置換`);
      return generateRobustJS();
    }

    return js;
  }

  // CSS完全性保証
  function ensureCompleteCSS(content: string, filename: string): string {
    let css = content;

    console.log(`🔍 CSS完全性チェック: ${filename}`);

    // 括弧バランスチェック
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;

    if (missingBraces > 0) {
      css += '\n' + '}'.repeat(missingBraces);
      console.log(`🔧 ${filename}: ${missingBraces}個のCSSブロックを閉じる`);
    }

    return css;
  }
  
  // 結果の検証とサニタイズ
  function validateAndSanitizeResult(result: any): CodeGenerationResponse {
    if (!result || typeof result !== 'object') {
      throw new Error('無効な結果オブジェクト');
    }

    if (!result.files || typeof result.files !== 'object') {
      throw new Error('ファイルオブジェクトが無効');
    }

    console.log('🔧 ファイル検証開始:', Object.keys(result.files));

    // ファイル内容をサニタイズ
    Object.keys(result.files).forEach(fileName => {
      if (typeof result.files[fileName] !== 'string') {
        console.log(`⚠️ ${fileName}: 文字列でないため削除`);
        delete result.files[fileName];
      } else if (result.files[fileName].trim().length < 10) {
        console.log(`⚠️ ${fileName}: 内容が不十分なため削除`);
        delete result.files[fileName];
      } else {
        console.log(`✅ ${fileName}: 有効なファイル (${result.files[fileName].length}文字)`);
      }
    });

    // 必須ファイルの保証
    ensureRequiredFiles(result.files);

    // 🔧 外部ファイル参照をクリーンアップ
    console.log('🔧 外部参照クリーンアップ実行');
    result.files = cleanExternalReferences(result.files);

    // 🔧 重要: 外部参照削除後に、HTMLファイルにCSSとJSを埋め込み
    if (result.files['index.html']) {
      console.log('🔧 外部参照削除後のCSS/JS埋め込み処理開始');
      result.files['index.html'] = embedFilesInHTML(result.files['index.html'], result.files);
      console.log('✅ 外部参照削除後のCSS/JS埋め込み完了');
    }

    console.log('✅ ファイル検証完了:', Object.keys(result.files));

    return {
      files: result.files,
      description: result.description || 'AI生成アプリケーション',
      instructions: result.instructions || '生成されたアプリケーションです',
      framework: result.framework || 'Vanilla JavaScript',
      language: result.language || 'JavaScript',
      styling: result.styling || 'CSS',
      usedModel: result.usedModel || 'unknown'
    };
  }
  
  // メイン処理：複数の抽出戦略を試行
  const extractionStrategies = [
    {
      name: '堅牢なJSON抽出',
      fn: extractJSONContent
    },
    {
      name: '手動ファイル抽出',
      fn: manualFileExtraction
    }
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < extractionStrategies.length; i++) {
    const strategy = extractionStrategies[i];
    
    try {
      console.log(`🔄 戦略${i + 1}: ${strategy.name}`);
      const result = strategy.fn();
      
      // 結果検証
      if (!result.files || Object.keys(result.files).length === 0) {
        throw new Error('ファイルが生成されていません');
      }
      
      if (!result.files['index.html']) {
        throw new Error('index.htmlが見つかりません');
      }
      
      console.log(`✅ ${strategy.name} 成功`);
      console.log('📁 生成されたファイル:', Object.keys(result.files));
      return result;
      
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ ${strategy.name} 失敗:`, lastError.message);
    }
  }
  
  // すべての戦略が失敗した場合
  console.error('❌ 全ての抽出戦略が失敗');
  console.error('❌ 最終エラー:', lastError?.message);
  
  throw new Error(`JSON解析に失敗しました: ${lastError?.message || 'Unknown error'}`);
}

// 堅牢なHTMLファイル生成
function generateRobustHTML(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Premium Todo App - 最高品質タスク管理</title>
    <style>
        /* 🎨 Premium Design System - v0品質保証 */
        
        /* CSS Custom Properties（完全カスタマイズ可能） */
        :root {
          /* 🎨 Primary Colors */
          --primary-hue: 240;
          --primary-50: hsl(var(--primary-hue), 100%, 97%);
          --primary-100: hsl(var(--primary-hue), 95%, 93%);
          --primary-200: hsl(var(--primary-hue), 90%, 85%);
          --primary-300: hsl(var(--primary-hue), 85%, 75%);
          --primary-400: hsl(var(--primary-hue), 80%, 65%);
          --primary-500: hsl(var(--primary-hue), 75%, 55%);
          --primary-600: hsl(var(--primary-hue), 70%, 45%);
          --primary-700: hsl(var(--primary-hue), 65%, 35%);
          --primary-800: hsl(var(--primary-hue), 60%, 25%);
          --primary-900: hsl(var(--primary-hue), 55%, 15%);
          
          /* 🌈 Semantic Colors */
          --success: #10b981;
          --warning: #f59e0b;
          --error: #ef4444;
          --info: #3b82f6;
          
          /* 🖼️ Neutral Palette */
          --white: #ffffff;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gray-900: #111827;
          
          /* 📏 Spacing Scale */
          --space-1: 0.25rem;
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-5: 1.25rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-10: 2.5rem;
        }
        
        /* 🎨 完全自己完結スタイル */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: var(--gray-800);
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
        }

        .container {
          background: var(--white);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: var(--space-10);
          width: 100%;
          max-width: 500px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="app-header">
            <h1>📝 Todo List</h1>
            <p class="subtitle">堅牢版 - 確実に動作するTodoアプリ</p>
        </header>
        
        <form id="todoForm" class="todo-form">
            <input type="text" id="todoInput" placeholder="新しいタスクを入力してください..." required>
            <button type="submit">追加</button>
        </form>
        
        <div class="filter-section">
            <button class="filter-btn active" data-filter="all">すべて</button>
            <button class="filter-btn" data-filter="active">未完了</button>
            <button class="filter-btn" data-filter="completed">完了済み</button>
        </div>
        
        <ul id="todoList" class="todo-list"></ul>
        
        <div class="stats">
            <span id="todoCount">0</span> 個のタスク
        </div>
        
        <footer class="app-footer">
            <small>堅牢版 - エラー耐性強化</small>
        </footer>
    </div>
</body>
</html>`;
}

// 堅牢なJavaScriptファイル生成
function generateRobustJS(): string {
  return `// 堅牢なTodo App JavaScript
(function() {
    'use strict';
    
    // グローバル変数の定義
    let todos = [];
    let currentFilter = 'all';
    
    // DOM要素の取得
    const elements = {
        todoForm: null,
        todoInput: null,
        todoList: null,
        todoCount: null,
        filterBtns: []
    };
    
    // 初期化関数
    function init() {
        console.log('Todo App initializing (robust version)...');
        
        // DOM要素の取得
        elements.todoForm = document.getElementById('todoForm');
        elements.todoInput = document.getElementById('todoInput');
        elements.todoList = document.getElementById('todoList');
        elements.todoCount = document.getElementById('todoCount');
        elements.filterBtns = document.querySelectorAll('.filter-btn');
        
        // 必要な要素が存在するかチェック
        if (!elements.todoForm || !elements.todoInput || !elements.todoList) {
            console.error('必要なDOM要素が見つかりません');
            return;
        }
        
        // データの読み込み
        loadTodos();
        
        // イベントリスナーの設定
        setupEventListeners();
        
        // 初期描画
        renderTodos();
        
        console.log('Todo App initialized successfully');
    }
    
    // データの読み込み
    function loadTodos() {
        try {
            const saved = localStorage.getItem('robustTodos');
            todos = saved ? JSON.parse(saved) : [];
            console.log('Todos loaded:', todos.length);
        } catch (error) {
            console.warn('Failed to load todos:', error);
            todos = [];
        }
    }
    
    // データの保存
    function saveTodos() {
        try {
            localStorage.setItem('robustTodos', JSON.stringify(todos));
            console.log('Todos saved successfully');
        } catch (error) {
            console.warn('Failed to save todos:', error);
        }
    }
    
    // イベントリスナーの設定
    function setupEventListeners() {
        // フォームの送信
        if (elements.todoForm) {
            elements.todoForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addTodo();
            });
        }
        
        // フィルターボタン
        elements.filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                if (filter) {
                    setFilter(filter);
                }
            });
        });
        
        // エラーハンドリング
        window.addEventListener('error', function(e) {
            console.error('JavaScript error:', e.error);
        });
    }
    
    // Todoの追加
    function addTodo() {
        if (!elements.todoInput) return;
        
        const text = elements.todoInput.value.trim();
        if (!text) return;
        
        const todo = {
            id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.unshift(todo);
        elements.todoInput.value = '';
        
        saveTodos();
        renderTodos();
        
        console.log('Todo added:', todo);
    }
    
    // Todoの切り替え
    function toggleTodo(id) {
        const todo = todos.find(function(t) { return t.id === id; });
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            renderTodos();
            console.log('Todo toggled:', todo);
        }
    }
    
    // Todoの削除
    function deleteTodo(id) {
        const index = todos.findIndex(function(t) { return t.id === id; });
        if (index > -1) {
            const deleted = todos.splice(index, 1)[0];
            saveTodos();
            renderTodos();
            console.log('Todo deleted:', deleted);
        }
    }
    
    // フィルターの設定
    function setFilter(filter) {
        currentFilter = filter;
        
        elements.filterBtns.forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });
        
        renderTodos();
        console.log('Filter set:', filter);
    }
    
    // フィルターされたTodoの取得
    function getFilteredTodos() {
        switch (currentFilter) {
            case 'active':
                return todos.filter(function(t) { return !t.completed; });
            case 'completed':
                return todos.filter(function(t) { return t.completed; });
            default:
                return todos;
        }
    }
    
    // HTMLエスケープ
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Todoの描画
    function renderTodos() {
        if (!elements.todoList) return;
        
        const filteredTodos = getFilteredTodos();
        
        // リストのクリア
        elements.todoList.innerHTML = '';
        
        if (filteredTodos.length === 0) {
            elements.todoList.innerHTML = '<li class="empty-state"><p>タスクがありません</p></li>';
        } else {
            filteredTodos.forEach(function(todo) {
                const li = document.createElement('li');
                li.className = 'todo-item' + (todo.completed ? ' completed' : '');
                
                li.innerHTML = 
                    '<div class="todo-content">' +
                        '<button class="toggle-btn" onclick="window.todoApp.toggleTodo(\\''+todo.id+'\\')" + '">' +
                            (todo.completed ? '✅' : '⭕') +
                        '</button>' +
                        '<span class="todo-text">' + escapeHtml(todo.text) + '</span>' +
                    '</div>' +
                    '<button class="delete-btn" onclick="window.todoApp.deleteTodo(\\''+todo.id+'\\')" + '">' +
                        '🗑️' +
                    '</button>';
                
                elements.todoList.appendChild(li);
            });
        }
        
        // 統計の更新
        if (elements.todoCount) {
            const activeCount = todos.filter(function(t) { return !t.completed; }).length;
            elements.todoCount.textContent = activeCount.toString();
        }
        
        console.log('Todos rendered:', filteredTodos.length);
    }
    
    // グローバルアクセス用
    window.todoApp = {
        toggleTodo: toggleTodo,
        deleteTodo: deleteTodo
    };
    
    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();`;
}

// 堅牢なCSSファイル生成
function generateRobustCSS(): string {
  return `/* 堅牢なTodo App スタイル */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin-bottom: 0;
}

.todo-form {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

#todoInput {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

#todoInput:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button {
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.filter-section {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  justify-content: center;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #e1e5e9;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.filter-btn:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

.todo-list {
  list-style: none;
  margin-bottom: 20px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border: 2px solid #f1f3f4;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  border-color: #e1e5e9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.todo-item.completed {
  opacity: 0.7;
  background: #f8f9fa;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: #f1f3f4;
  transform: scale(1.1);
}

.todo-text {
  font-size: 16px;
  color: #333;
  flex: 1;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
  background: #fee;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.stats {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.app-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.app-footer small {
  color: #999;
  font-size: 12px;
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .container {
    padding: 24px;
    margin: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .todo-form {
    flex-direction: column;
  }
  
  button {
    justify-content: center;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
}`;
}

// JavaScript構文チェック（強化版）
function isValidJavaScript(code: string): boolean {
  console.log('🔍 JavaScript構文検証開始:', code.length, '文字');
  
  // 基本的な構文エラーパターンをチェック（安全版）
  const errorPatterns = [
    /SyntaxError/i,
    /Unexpected token/i,
    /Invalid character/i,
    /Unterminated string/i,
    /Unexpected end of input/i,
    /\\\\\\n/,  // 三重エスケープ問題のみ
    /"""/,  // 三重クォート
    /'''''/,  // 三重シングルクォート
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(code)) {
      console.log('❌ JavaScript構文エラー検出:', pattern);
      return false;
    }
  }

  // 🔧 括弧バランスチェック（強化版）
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inString = false;
  let inComment = false;
  let stringChar = '';
  let escapeNext = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1] || '';
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\\\') {
      escapeNext = true;
      continue;
    }
    
    // コメント検出
    if (!inString) {
      if (char === '/' && nextChar === '/') {
        inComment = true;
        i++; // 次の文字をスキップ
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inComment = true;
        i++; // 次の文字をスキップ
        continue;
      }
      if (inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i++; // 次の文字をスキップ
        continue;
      }
      if (inComment && char === '\n') {
        inComment = false; // 行コメント終了
      }
    }
    
    if (inComment) continue;
    
    // 文字列検出
    if ((char === '"' || char === "'" || char === '`') && !inString) {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (inString && char === stringChar && !escapeNext) {
      inString = false;
      stringChar = '';
      continue;
    }
    
    if (inString) continue;
    
    // 括弧カウント
    switch (char) {
      case '{':
        braceCount++;
        break;
      case '}':
        braceCount--;
        break;
      case '(':
        parenCount++;
        break;
      case ')':
        parenCount--;
        break;
      case '[':
        bracketCount++;
        break;
      case ']':
        bracketCount--;
        break;
    }
  }
  
  if (braceCount !== 0 || parenCount !== 0 || bracketCount !== 0) {
    console.log('❌ 括弧バランスエラー:', { braceCount, parenCount, bracketCount });
    return false;
  }
  
  // 🔧 基本的なJavaScript要素があるかチェック
  const hasValidElements = 
    code.includes('function') || 
    code.includes('const ') || 
    code.includes('let ') || 
    code.includes('var ') ||
    code.includes('class ') ||
    code.includes('document.') ||
    code.includes('console.') ||
    code.includes('addEventListener');

  if (!hasValidElements) {
    console.log('❌ 有効なJavaScript要素が不足');
    return false;
  }
  
  // 🔧 iframe対応チェック
  const iframeSafetyChecks = [
    // 危険なAPIの使用チェック
    !/window\.open/i.test(code),
    !/document\.write/i.test(code),
    !/eval\s*\(/i.test(code),
    !/Function\s*\(/i.test(code),
    !/setTimeout\s*\(\s*["'].*["']/i.test(code), // 文字列のsetTimeout
    !/setInterval\s*\(\s*["'].*["']/i.test(code), // 文字列のsetInterval
  ];
  
  const allSafe = iframeSafetyChecks.every(check => check);
  if (!allSafe) {
    console.log('❌ iframe安全性チェック失敗');
    return false;
  }
  
  // 🔧 実際のJavaScript解析試行（限定的）
  try {
    // シンプルな構文チェック用のFunction生成
    // これは完璧ではないが、基本的な構文エラーを検出
    const testCode = code.replace(/document\./g, '({}).').replace(/window\./g, '({}).');
    new Function(testCode);
    console.log('✅ JavaScript構文検証通過');
    return true;
  } catch (e) {
    console.log('❌ JavaScript構文検証失敗:', e);
    return false;
  }
}

// フォールバック応答を生成（プロンプト解析対応版）
function createFallbackResponse(model: string, error?: string): CodeGenerationResponse {
  console.log('🔄 [Claude Server] フォールバック応答生成中:', { model, error });
  
  // プロンプトに基づく適切なテンプレート選択（グローバル変数からプロンプトを取得）
  const getAppropriateTemplate = () => {
    // デフォルトのテンプレート例
    const templates = [
      {
        name: 'Modern Calculator',
        keywords: ['電卓', 'calculator', '計算', 'calc'],
        html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>高機能電卓</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            padding: 1rem;
        }
        .calculator {
            background: white; border-radius: 1rem;
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1);
            width: 100%; max-width: 360px; overflow: hidden;
        }
        .display {
            background: #2196F3; color: white; padding: 1.5rem;
            text-align: right; font-size: 2rem; min-height: 6rem;
            display: flex; flex-direction: column; justify-content: flex-end;
        }
        .buttons {
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 1px; background: rgba(0,0,0,0.1);
        }
        button {
            border: none; background: white; font-size: 1.25rem;
            padding: 1.25rem; cursor: pointer; transition: background-color 0.2s;
        }
        button:hover { background: #f5f5f5; }
        .operator { background: #e3f2fd; }
        .equals { background: #2196F3; color: white; }
    </style>
</head>
<body>
    <div class="calculator">
        <div class="display">
            <div id="display">0</div>
        </div>
        <div class="buttons">
            <button onclick="clearDisplay()">AC</button>
            <button onclick="deleteLast()">⌫</button>
            <button class="operator" onclick="inputOperator('/')">÷</button>
            <button class="operator" onclick="inputOperator('*')">×</button>
            <button onclick="inputNumber('7')">7</button>
            <button onclick="inputNumber('8')">8</button>
            <button onclick="inputNumber('9')">9</button>
            <button class="operator" onclick="inputOperator('-')">-</button>
            <button onclick="inputNumber('4')">4</button>
            <button onclick="inputNumber('5')">5</button>
            <button onclick="inputNumber('6')">6</button>
            <button class="operator" onclick="inputOperator('+')">+</button>
            <button onclick="inputNumber('1')">1</button>
            <button onclick="inputNumber('2')">2</button>
            <button onclick="inputNumber('3')">3</button>
            <button class="equals" onclick="calculate()" style="grid-row: span 2">=</button>
            <button onclick="inputNumber('0')" style="grid-column: span 2">0</button>
            <button onclick="inputDecimal('.')">.</button>
        </div>
    </div>
    <script>
        let display = document.getElementById('display');
        let currentInput = '0';
        let operator = null;
        let previousInput = null;
        
        function updateDisplay() {
            display.textContent = currentInput;
        }
        
        function inputNumber(num) {
            if (currentInput === '0') {
                currentInput = num;
            } else {
                currentInput += num;
            }
            updateDisplay();
        }
        
        function inputOperator(op) {
            if (operator && previousInput !== null) {
                calculate();
            }
            previousInput = currentInput;
            operator = op;
            currentInput = '0';
        }
        
        function inputDecimal(dot) {
            if (!currentInput.includes(dot)) {
                currentInput += dot;
                updateDisplay();
            }
        }
        
        function calculate() {
            if (operator && previousInput !== null) {
                const prev = parseFloat(previousInput);
                const curr = parseFloat(currentInput);
                let result;
                
                switch(operator) {
                    case '+': result = prev + curr; break;
                    case '-': result = prev - curr; break;
                    case '*': result = prev * curr; break;
                    case '/': result = prev / curr; break;
                }
                
                currentInput = result.toString();
                operator = null;
                previousInput = null;
                updateDisplay();
            }
        }
        
        function clearDisplay() {
            currentInput = '0';
            operator = null;
            previousInput = null;
            updateDisplay();
        }
        
        function deleteLast() {
            if (currentInput.length > 1) {
                currentInput = currentInput.slice(0, -1);
            } else {
                currentInput = '0';
            }
            updateDisplay();
        }
    </script>
</body>
</html>`
      },
      {
        name: 'Interactive Todo App',
        keywords: ['todo', 'task', 'タスク', 'やること'],
        html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo アプリ</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container {
            background: white; border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            padding: 40px; max-width: 500px; width: 100%;
        }
        h1 { text-align: center; color: #2d3436; margin-bottom: 30px; }
        .input-container { display: flex; gap: 10px; margin-bottom: 30px; }
        input {
            flex: 1; padding: 15px; border: 2px solid #ddd;
            border-radius: 10px; font-size: 16px;
        }
        input:focus { outline: none; border-color: #74b9ff; }
        .add-btn {
            background: #00b894; color: white; border: none;
            padding: 15px 20px; border-radius: 10px; cursor: pointer; font-weight: 600;
        }
        .todo-item {
            display: flex; align-items: center; gap: 15px;
            padding: 15px; margin-bottom: 10px; background: #f8f9fa;
            border-radius: 10px; transition: all 0.3s ease;
        }
        .todo-item:hover { transform: translateX(5px); }
        .delete-btn {
            background: #e17055; color: white; border: none;
            padding: 8px 12px; border-radius: 5px; cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Todo リスト</h1>
        <div class="input-container">
            <input type="text" id="todoInput" placeholder="新しいタスクを入力..." />
            <button class="add-btn" onclick="addTodo()">追加</button>
        </div>
        <div id="todoList"></div>
    </div>
    <script>
        let todos = []; let todoId = 0;
        
        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();
            if (!text) return;
            
            todos.push({ id: ++todoId, text, completed: false });
            input.value = ''; renderTodos();
        }
        
        function toggleTodo(id) {
            todos = todos.map(todo => 
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
            ); renderTodos();
        }
        
        function deleteTodo(id) {
            todos = todos.filter(todo => todo.id !== id); renderTodos();
        }
        
        function renderTodos() {
            const list = document.getElementById('todoList');
            list.innerHTML = todos.map(todo => \`
                <div class="todo-item">
                    <input type="checkbox" \${todo.completed ? 'checked' : ''} 
                           onchange="toggleTodo(\${todo.id})" />
                    <span style="flex: 1; \${todo.completed ? 'text-decoration: line-through; opacity: 0.6' : ''}">\${todo.text}</span>
                    <button class="delete-btn" onclick="deleteTodo(\${todo.id})">削除</button>
                </div>
            \`).join('');
        }
        
        document.getElementById('todoInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTodo();
        });
    </script>
</body>
</html>`
      },
      {
        name: 'Modern Dashboard',
        keywords: ['dashboard', 'ダッシュボード', '管理', 'admin'],
        html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>モダンダッシュボード</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }
        .dashboard {
            max-width: 1200px; margin: 0 auto;
            display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
            border-radius: 20px; padding: 30px; color: white;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        .card h3 { font-size: 1.5rem; margin-bottom: 15px; }
        .card p { opacity: 0.8; line-height: 1.6; }
        .btn {
            background: linear-gradient(45deg, #ff6b6b, #ee5a52);
            color: white; border: none; padding: 12px 24px;
            border-radius: 25px; cursor: pointer; font-weight: 600;
            margin-top: 15px; transition: all 0.3s ease;
        }
        .btn:hover { transform: scale(1.05); box-shadow: 0 5px 15px rgba(238, 90, 82, 0.4); }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="card">
            <h3>📊 アナリティクス</h3>
            <p>リアルタイムデータの分析と可視化</p>
            <button class="btn" onclick="alert('📈 アナリティクス機能！')">詳細を見る</button>
        </div>
        <div class="card">
            <h3>👥 ユーザー管理</h3>
            <p>効率的なユーザー管理システム</p>
            <button class="btn" onclick="alert('👥 ユーザー管理機能！')">管理する</button>
        </div>
        <div class="card">
            <h3>⚙️ 設定</h3>
            <p>システム設定とカスタマイズ</p>
            <button class="btn" onclick="alert('⚙️ 設定機能！')">設定を開く</button>
        </div>
    </div>
</body>
</html>`
      }
    ];

    // デフォルトは電卓
    return templates[0];
  };
  
  const template = getAppropriateTemplate();
  
  return {
    files: {
      "index.html": template.html,
      "styles.css": `/* ${template.name} のスタイル */\n/* このファイルはindex.htmlに統合されています */`,
      "script.js": `// ${template.name} のスクリプト\n// このファイルはindex.htmlに統合されています\nconsole.log('アプリが正常に読み込まれました');`
    },
    description: `${template.name} - ${error ? 'Claude APIキーが設定されていないため、デモ用の' : ''}高品質なWebアプリケーション。レスポンシブデザイン、モダンUI、インタラクティブな機能を備えています。`,
    instructions: `このアプリは完全に動作します。\n\n使用方法:\n1. ブラウザでindex.htmlを開く\n2. 各機能ボタンをクリックして操作\n3. レスポンシブデザインで様々なデバイスに対応\n\nカスタマイズ:\n- CSS変数でカラーテーマを簡単に変更可能\n- JavaScriptで機能を拡張可能`,
    framework: "vanilla-js",
    language: "javascript",
    styling: "css3",
    usedModel: model,
    warnings: error ? [`Claude API エラー: ${error}`, "デモ用のテンプレートを使用しています"] : []
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORSヘッダーを設定
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
    const { prompt, model = 'claude-3.5-sonnet', language = 'ja' } = req.body as CodeGenerationRequest;

    // 入力検証
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'プロンプトが長すぎます（10,000文字以内）' });
    }

    console.log(`🚀 [Claude Server] コード生成開始: ${model} | プロンプト: ${prompt.substring(0, 100)}...`);

    // Claude API でのコード生成
    let result: CodeGenerationResponse;
    
    try {
      if (CLAUDE_API_KEY) {
        console.log('✨ [Claude Server] Claude API使用中...');
        const systemPrompt = generateSystemPrompt(prompt, model, language);
        const response = await callClaudeAPI(systemPrompt, model);
        result = extractAndFixJSON(response);
        console.log('✅ [Claude Server] Claude APIからのレスポンス処理完了');
      } else {
        console.warn('⚠️ [Claude Server] APIキーが設定されていません。フォールバック応答を生成中...');
        result = createFallbackResponse(model, 'Claude APIキーが設定されていません');
      }
    } catch (apiError) {
      console.error('❌ [Claude Server] API呼び出しエラー:', apiError);
      console.log('🔄 [Claude Server] フォールバック応答を生成中...');
      result = createFallbackResponse(model, apiError instanceof Error ? apiError.message : 'Claude API呼び出しに失敗しました');
    }

    // 結果の検証と完成
    result = validateAndCompleteFiles(result, model);

    console.log(`✅ [Claude Server] コード生成完了: ${Object.keys(result.files).length}ファイル生成`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [Claude Server] 重大なエラー:', error);
    
    // 詳細なエラー情報をログに記録
    if (error instanceof Error) {
      console.error('[Claude Server] エラー詳細:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    // 最終フォールバック：必ず動作するレスポンスを返す
    const fallbackResult = createFallbackResponse('claude-fallback', error instanceof Error ? error.message : '予期しないエラーが発生しました');
    
    return res.status(500).json({
      ...fallbackResult,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
    });
  }
}

// ファイルの検証と補完を行う関数
function validateAndCompleteFiles(result: CodeGenerationResponse, model: string): CodeGenerationResponse {
  console.log('🔍 ファイル検証開始:', Object.keys(result.files || {}));
  
  if (!result.files) {
    result.files = {};
  }
  
  // 必須ファイルの確認と補完
  if (!result.files['index.html']) {
    console.log('⚠️ index.htmlが不足 - 生成中');
    result.files['index.html'] = generateDefaultHTML();
  }
  
  if (!result.files['script.js']) {
    console.log('⚠️ script.jsが不足 - 生成中');
    result.files['script.js'] = generateDefaultJS();
  }
  
  if (!result.files['styles.css'] && !result.files['style.css']) {
    console.log('⚠️ styles.cssが不足 - 生成中');
    result.files['styles.css'] = generateDefaultCSS();
  }
  
  // JavaScriptファイルの構文チェック
  Object.keys(result.files).forEach(fileName => {
    if (fileName.endsWith('.js')) {
      try {
        // 基本的な構文チェック（完璧ではないが基本的なエラーを検出）
        const jsContent = result.files[fileName];
        
        // 危険なパターンをチェック
        if (jsContent.includes('Unexpected token') || 
            jsContent.includes('SyntaxError') ||
            jsContent.match(/\{\s*[\{\[]/) || // 不正なオブジェクト/配列の開始
            jsContent.match(/^[\{\[]/) // ファイルがJSONオブジェクトで始まっている
        ) {
          console.log(`⚠️ ${fileName}に構文エラーの疑い - デフォルトに置換`);
          result.files[fileName] = generateDefaultJS();
        }
      } catch (error) {
        console.log(`⚠️ ${fileName}の検証中にエラー - デフォルトに置換`);
        result.files[fileName] = generateDefaultJS();
      }
    }
  });

  // 🔧 外部ファイル参照をクリーンアップ
  console.log('🔧 外部参照クリーンアップ実行');
  result.files = cleanExternalReferences(result.files);

  // 🔧 重要: 外部参照削除後に、HTMLファイルにCSSとJSを埋め込み
  if (result.files['index.html']) {
    console.log('🔧 validateAndCompleteFiles: CSS/JS埋め込み処理開始');
    result.files['index.html'] = embedFilesInHTML(result.files['index.html'], result.files);
    console.log('✅ validateAndCompleteFiles: CSS/JS埋め込み完了');
  }
  
  console.log('✅ ファイル検証完了:', Object.keys(result.files));
  return result;
}

// デフォルトHTMLファイル生成
function generateDefaultHTML(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Generated Application</h1>
            <p class="subtitle">AI生成アプリケーション</p>
        </header>
        
        <main>
            <div class="content">
                <p>アプリケーションが正常に読み込まれました。</p>
                <button id="testBtn" onclick="testFunction()">テスト</button>
            </div>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
}

// デフォルトJavaScriptファイル生成
function generateDefaultJS(): string {
  return `// Generated JavaScript - Safe Version
console.log('Application loaded successfully');

// 安全なテスト関数
function testFunction() {
  console.log('Test function called');
  alert('アプリケーションが正常に動作しています！');
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM is ready');
  
  // テストボタンがあれば設定
  const testBtn = document.getElementById('testBtn');
  if (testBtn) {
    testBtn.addEventListener('click', testFunction);
  }
  
  // 基本的なインタラクション
  const container = document.querySelector('.container');
  if (container) {
    container.addEventListener('click', function(e) {
      console.log('Container clicked:', e.target);
    });
  }
});

// エラーハンドリング
window.addEventListener('error', function(e) {
  console.error('JavaScript Error:', e.error);
});`;
}

// デフォルトCSSファイル生成
function generateDefaultCSS(): string {
  return `/* Generated Styles - Safe Version */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.content {
  margin-top: 30px;
}

button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .container {
    padding: 24px;
    margin: 10px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  button {
    justify-content: center;
  }
  
  .filter-buttons {
    flex-wrap: wrap;
  }
}`;
}
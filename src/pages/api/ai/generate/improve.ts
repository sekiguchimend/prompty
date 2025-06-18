import { NextApiRequest, NextApiResponse } from 'next';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
}

const generateImprovementPrompt = (
  originalCode: string,
  improvementRequest: string,
  framework: string,
  model: string,
  language: string = 'ja'
) => {
  const isJapanese = language === 'ja';
  
  // 既存コードの解析を試行
  let existingFiles: Record<string, string> = {};
  try {
    const parsed = JSON.parse(originalCode);
    if (parsed.files && typeof parsed.files === 'object') {
      existingFiles = parsed.files;
    }
  } catch {
    // JSONでない場合は、単一ファイルとして扱う
    if (originalCode.includes('<!DOCTYPE html>') || originalCode.includes('<html')) {
      existingFiles['index.html'] = originalCode;
    } else if (originalCode.includes('function') || originalCode.includes('const') || originalCode.includes('let')) {
      existingFiles['script.js'] = originalCode;
    } else if (originalCode.includes('{') && originalCode.includes('}') && originalCode.includes(':')) {
      existingFiles['styles.css'] = originalCode;
    }
  }
  
  const existingFilesInfo = Object.keys(existingFiles).length > 0
    ? `\n## 🔒 保護対象の既存ファイル\n${Object.keys(existingFiles).map(name => `- ${name}: ${existingFiles[name].length}文字 ← 完全保持必須`).join('\n')}`
    : '';
  
  return `あなたは世界最高レベルのフルスタック開発者です。既存のコードを改善してください。

## 🚨 絶対的な禁止事項（違反は致命的エラー）
1. ❌ 既存コードの削除・変更・置換は一切禁止
2. ❌ 既存コードを「改良」「最適化」「リファクタリング」することは禁止
3. ❌ 既存のHTML構造、CSS、JavaScriptを書き換えることは禁止
4. ❌ 既存ファイルの内容を短縮・省略することは禁止

## ✅ 唯一の許可操作
- 既存コードの「末尾に追加」のみ許可
- 新しい機能やスタイルを既存コードの後に「追加」することのみ許可

## 🔒 完全保護対象の既存コード
${originalCode}${existingFilesInfo}

## 📝 改善要求
${improvementRequest}

## 📐 実装ルール（絶対遵守）
1. **100%保持**: 既存コードを1文字も変更せず、完全にそのまま保持
2. **末尾追加**: 新機能は既存コードの「最後に」追加のみ
3. **互換性維持**: 既存機能が確実に動作し続けることを保証
4. **段階的改善**: 既存 + 新規 = 改善版の構造

## 🎯 出力形式（厳格に遵守）
⚠️ 以下の JSON 形式のみ有効。説明文は一切含めない。
⚠️ 既存コードを完全に含めた上で、新機能を追加すること。
⚠️ エスケープ: 改行は\\n、ダブルクォートは\\"、バックスラッシュは\\\\

{
  "files": {
    "index.html": "【既存のHTMLコード全体をここに完全コピー】\\n\\n<!-- ===== 追加機能 ===== -->\\n【新しいHTML要素】",
    "styles.css": "/* ===== 既存CSS（完全保持） ===== */\\n【既存のCSSコード全体をここに完全コピー】\\n\\n/* ===== 追加スタイル ===== */\\n【新しいCSSコード】",
    "script.js": "// ===== 既存JavaScript（完全保持） =====\\n【既存のJavaScriptコード全体をここに完全コピー】\\n\\n// ===== 追加機能 =====\\n【新しいJavaScriptコード】"
  },
  "description": "${isJapanese ? '既存機能を100%保持し、新機能を追加しました' : 'Existing features 100% preserved, new features added'}",
  "instructions": "${isJapanese ? '既存の全機能がそのまま利用でき、さらに新機能も利用可能です' : 'All existing features remain intact, plus new features are available'}",
  "framework": "${framework}",
  "language": "javascript",
  "styling": "css",
  "usedModel": "${model}",
  "preservedExisting": true
}

## 🔴 最重要確認事項
- ✅ 既存コードを1行も削除していないか？
- ✅ 既存コードを1文字も変更していないか？
- ✅ 新機能は既存コードの「後」に追加されているか？
- ✅ 有効なJSONが返されているか？

既存コードの保持が不完全な場合、このタスクは失敗となります。`;
};

async function callClaudeAPI(prompt: string, model: string): Promise<string> {
  if (!CLAUDE_API_KEY) throw new Error('Claude API key not configured');

  // すべてClaude 4 Sonnetを使用
  const claudeModel = 'claude-4-sonnet';

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
      temperature: 0.7,
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

// 外部ファイル参照をクリーンアップする関数
function cleanExternalReferences(files: Record<string, string>): Record<string, string> {
  const cleanedFiles = { ...files };
  
  // HTMLファイルから外部参照を除去
  Object.keys(cleanedFiles).forEach(filename => {
    if (filename.endsWith('.html')) {
      let html = cleanedFiles[filename];
      
      // 🔧 CSS外部参照を徹底的に除去
      html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]*href=["']styles?\.css["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]*href=["']style\.css["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi, '');
      
      // 🔧 JavaScript外部参照を徹底的に除去
      html = html.replace(/<script[^>]*src=["'][^"']*\.js["'][^>]*><\/script>/gi, '');
      html = html.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');
      html = html.replace(/<script[^>]*src=["']scripts\.js["'][^>]*><\/script>/gi, '');
      html = html.replace(/<script[^>]*src=["'][^"']*\.js["'][^>]*>/gi, '');
      
      // 🔧 追加の外部参照パターンを除去
      html = html.replace(/<link[^>]*href=["'][^"']*\.(css|js|ico|png|jpg|gif)["'][^>]*>/gi, '');
      html = html.replace(/<script[^>]*src=["'][^"']*["'][^>]*><\/script>/gi, '');
      
      // 🔧 Google Fonts など外部リソースを除去（オプション）
      // html = html.replace(/<link[^>]*href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>/gi, '');
      // html = html.replace(/<link[^>]*href=["']https:\/\/fonts\.gstatic\.com[^"']*["'][^>]*>/gi, '');
      
      cleanedFiles[filename] = html;
      
      const remainingRefs = {
        cssLinks: (html.match(/<link[^>]*href=["'][^"']*\.css["'][^>]*>/gi) || []).length,
        jsScripts: (html.match(/<script[^>]*src=["'][^"']*\.js["'][^>]*>/gi) || []).length,
        allLinks: (html.match(/<link[^>]*href=["'][^"']*["'][^>]*>/gi) || []).length,
        allScripts: (html.match(/<script[^>]*src=["'][^"']*["'][^>]*>/gi) || []).length
      };
    }
  });
  
  return cleanedFiles;
}

// HTMLファイルにCSSとJavaScriptを埋め込む関数
function embedFilesInHTML(html: string, files: Record<string, string>): string {
  let embeddedHTML = html;
  
  
  // CSSの埋め込み
  const cssFiles = Object.keys(files).filter(name => name.endsWith('.css'));
  if (cssFiles.length > 0) {
    let allCSS = '';
    cssFiles.forEach(cssFile => {
      allCSS += `\n/* ===== ${cssFile} ===== */\n`;
      allCSS += files[cssFile];
      allCSS += '\n';
    });
    
    if (allCSS.trim()) {
      const cssStyle = `\n    <style>\n${allCSS}    </style>`;
      
      if (embeddedHTML.includes('</head>')) {
        embeddedHTML = embeddedHTML.replace('</head>', cssStyle + '\n</head>');
      } else {
        embeddedHTML = embeddedHTML.replace('<body>', `<head>${cssStyle}\n</head>\n<body>`);
      }
      
    }
  }
  
  // JavaScriptの埋め込み
  const jsFiles = Object.keys(files).filter(name => name.endsWith('.js'));
  if (jsFiles.length > 0) {
    let allJS = '';
    jsFiles.forEach(jsFile => {
      allJS += `\n// ===== ${jsFile} =====\n`;
      allJS += files[jsFile];
      allJS += '\n';
    });
    
    if (allJS.trim()) {
      const jsScript = `\n    <script>\n${allJS}    </script>`;
      
      if (embeddedHTML.includes('</body>')) {
        embeddedHTML = embeddedHTML.replace('</body>', jsScript + '\n</body>');
      } else {
        embeddedHTML += jsScript;
      }
      
    }
  }
  
  return embeddedHTML;
}

function extractAndFixJSON(text: string, originalCode?: string): CodeGenerationResponse {
  
  // 既存コードの解析（強化版）
  let existingFiles: Record<string, string> = {};
  if (originalCode) {
    
    try {
      const parsed = JSON.parse(originalCode);
      if (parsed.files && typeof parsed.files === 'object') {
        existingFiles = parsed.files;
      }
    } catch {
      // JSONでない場合の詳細解析
      
      // HTMLファイルの検出
      if (originalCode.includes('<!DOCTYPE html>') || originalCode.includes('<html')) {
        existingFiles['index.html'] = originalCode;
      }
      
      // CSSコードの検出（HTMLに埋め込まれている場合も含む）
      const cssMatch = originalCode.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (cssMatch) {
        const cssContent = cssMatch.map(match => match.replace(/<\/?style[^>]*>/gi, '')).join('\n');
        existingFiles['styles.css'] = cssContent;
      } else if (originalCode.includes('{') && originalCode.includes('}') && originalCode.includes(':')) {
        // スタンドアロンCSSの検出
        const cssLines = originalCode.split('\n').filter(line => 
          line.includes(':') || line.includes('{') || line.includes('}') || line.startsWith('/*')
        );
        if (cssLines.length > 3) {
          existingFiles['styles.css'] = originalCode;
        }
      }
      
      // JavaScriptコードの検出（HTMLに埋め込まれている場合も含む）
      const jsMatch = originalCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (jsMatch) {
        const jsContent = jsMatch.map(match => match.replace(/<\/?script[^>]*>/gi, '')).join('\n');
        existingFiles['script.js'] = jsContent;
      } else if (originalCode.includes('function') || originalCode.includes('const') || originalCode.includes('let') || originalCode.includes('document.')) {
        // スタンドアロンJavaScriptの検出
        existingFiles['script.js'] = originalCode;
      }
      
    }
    
    // 既存ファイルの検証
    Object.keys(existingFiles).forEach(filename => {
      const content = existingFiles[filename];
      if (!content || content.trim().length < 10) {
        delete existingFiles[filename];
      } else {
      }
    });
  }
  
  // レスポンス全体をログ出力（デバッグ用）
  
  // 既存ファイルがある場合の特別処理
  if (Object.keys(existingFiles).length > 0) {
  }
  
  // 最も堅牢なアプローチ：文字単位でJSONを解析
  function extractJSONContent(): CodeGenerationResponse {
    
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
        break;
      }
    }
    
    if (jsonStart === -1) {
      throw new Error('JSON開始位置が見つかりません');
    }
    
    // 対応する終了括弧を探す
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = jsonStart; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1) {
      throw new Error('JSON終了位置が見つかりません');
    }
    
    let jsonString = text.slice(jsonStart, jsonEnd + 1);
    
    // 文字レベルでの修復処理
    jsonString = fixJSONString(jsonString);
    
    // JSONパースを試行
    try {
      const parsed = JSON.parse(jsonString);
      return validateAndSanitizeResult(parsed, existingFiles);
    } catch (error) {
      throw error;
    }
  }
  
  // JSON文字列を修復する関数
  function fixJSONString(jsonStr: string): string {
    
    let fixed = jsonStr;
    
    // 1. テンプレートリテラル（バッククォート）の処理
    if (fixed.includes('`')) {
      
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
    
    return fixed;
  }
  
  // 手動ファイル抽出（最後の手段）
  function manualFileExtraction(): CodeGenerationResponse {
    
    const files: Record<string, string> = {};
    
    // より安全なファイル抽出関数
    function extractFileContent(fileName: string): string {
      
      // パターンマッチング: "filename": "content"
      const patterns = [
        new RegExp(`"${fileName}"\\s*:\\s*"`, 'i'),
        new RegExp(`'${fileName}'\\s*:\\s*"`, 'i'),
        new RegExp(`${fileName}\\s*:\\s*"`, 'i')
      ];
      
      let startIndex = -1;
      let usedPattern = null;
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          usedPattern = match[0];
          startIndex = text.indexOf(match[0]) + match[0].length;
          break;
        }
      }
      
      if (startIndex === -1) {
        return '';
      }
      
      
      // 🔧 改善: より堅牢なコンテンツ終了検出
      let content = '';
      let i = startIndex;
      let escapeNext = false;
      let foundEnd = false;
      let braceDepth = 0;
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
        
        if (char === '"') {
          if (inQuote) {
            // 文字列の終了候補
            foundEnd = true;
            break;
          } else {
            content += char;
            inQuote = true;
          }
        } else {
          content += char;
        }
        
        i++;
        
        // 🔧 セーフティ: 200KB を超えたら強制終了
        if (content.length > 200000) {
          break;
        }
      }
      
      // 🔧 コンテンツが途中で切れている場合の修復
      if (!foundEnd && content.length > 0) {
        
        // JavaScript ファイルの場合の修復
        if (fileName.endsWith('.js')) {
          // 最後の行が不完全な場合は削除
          const lines = content.split('\n');
          const lastLine = lines[lines.length - 1];
          
          // 最後の行が明らかに不完全（コメントの途中など）
          if (lastLine.trim().startsWith('//') && !lastLine.includes('完了') && !lastLine.includes('終了')) {
            lines.pop();
            content = lines.join('\n');
          }
          
          // 関数やクラスが開いたままの場合は閉じる
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            content += '\n' + '}'.repeat(missingBraces);
          }
        }
        
        // HTML ファイルの場合の修復
        if (fileName.endsWith('.html')) {
          if (!content.includes('</html>')) {
            if (!content.includes('</body>')) {
              content += '\n</body>';
            }
            content += '\n</html>';
          }
        }
        
        // CSS ファイルの場合の修復
        if (fileName.endsWith('.css')) {
          const openBraces = (content.match(/\{/g) || []).length;
          const closeBraces = (content.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            content += '\n' + '}'.repeat(missingBraces);
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
    
    // 🔧 重要: 既存ファイルとのマージ（既存コードを絶対に保持）
    mergeWithExistingFiles(files, existingFiles);
    
    // 🔧 重要: 既存ファイルがある場合は、フォールバックファイル生成をスキップ
    if (Object.keys(existingFiles).length > 0) {
      
      // 既存ファイルが十分でない場合のみ、最小限の補完
      Object.keys(existingFiles).forEach(filename => {
        if (!files[filename] || files[filename].trim().length === 0) {
          files[filename] = existingFiles[filename];
        }
      });
    } else {
      // 既存ファイルがない場合のみフォールバック生成
      ensureRequiredFiles(files);
    }
    
    // メタデータの抽出
    const metadata = extractMetadata();
    
    return {
      files,
      description: metadata.description || '既存コードを保持した改善版アプリケーション',
      instructions: metadata.instructions || '既存機能を維持しつつ改善されました',
      framework: metadata.framework || 'Vanilla JavaScript',
      language: metadata.language || 'JavaScript',
      styling: metadata.styling || 'CSS',
      usedModel: metadata.usedModel || 'unknown'
    };
  }
  
  // 既存ファイルとのマージ（完全保持版）
  function mergeWithExistingFiles(newFiles: Record<string, string>, existingFiles: Record<string, string>) {
    if (Object.keys(existingFiles).length === 0) return;
    
    
    Object.keys(existingFiles).forEach(filename => {
      const existingContent = existingFiles[filename];
      const newContent = newFiles[filename];
      
      
      // 🔒 最重要：既存コンテンツは絶対に保持 - 新しいコンテンツの有無は関係なし
      if (newContent && newContent.trim().length > 0 && newContent !== existingContent) {
        // 新しいコンテンツがあり、既存と異なる場合：既存 + 新規で追加
        
        if (filename.endsWith('.css')) {
          // CSSの場合：既存スタイルを完全保持し、新しいスタイルを追加
          newFiles[filename] = existingContent + '\n\n/* ✨ 改善機能で追加されたスタイル */\n' + newContent;
        } else if (filename.endsWith('.js')) {
          // JavaScriptの場合：既存コードを完全保持し、新しいコードを追加
          newFiles[filename] = existingContent + '\n\n// ✨ 改善機能で追加されたコード\n' + newContent;
        } else if (filename.endsWith('.html')) {
          // HTMLの場合：既存HTMLを保持し、新しい要素を追加
          if (existingContent.includes('</body>')) {
            // bodyタグがある場合は、その直前に新しい要素を追加
            const bodyContent = extractBodyContent(newContent);
            if (bodyContent) {
              newFiles[filename] = existingContent.replace(
                /<\/body>/i,
                `\n    <!-- ✨ 改善機能で追加された要素 -->\n${bodyContent}\n</body>`
              );
            } else {
              newFiles[filename] = existingContent + '\n\n<!-- ✨ 改善機能で追加されたHTML -->\n' + newContent;
            }
          } else {
            newFiles[filename] = existingContent + '\n\n<!-- ✨ 改善機能で追加されたHTML -->\n' + newContent;
          }
        } else {
          // その他のファイル：既存コンテンツを保持し、新しいコンテンツを追加
          newFiles[filename] = existingContent + '\n\n' + newContent;
        }
      } else {
        // 🔒 新しいコンテンツがない、または既存と同じ場合：既存コンテンツをそのまま保持
        newFiles[filename] = existingContent;
      }
      
    });
    
    // 🔒 重要：既存ファイルで新規ファイルに含まれていないものも確実に保持
    Object.keys(existingFiles).forEach(filename => {
      if (!newFiles[filename]) {
        newFiles[filename] = existingFiles[filename];
      }
    });
    
  }
  
  // HTMLのbodyコンテンツを抽出
  function extractBodyContent(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1].trim() : '';
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
  
  // 必須ファイルの保証
  function ensureRequiredFiles(files: Record<string, string>) {
    
    // 🔧 ファイル完全性チェックと修復
    Object.keys(files).forEach(filename => {
      const content = files[filename];
      if (!content || content.trim().length === 0) {
        delete files[filename];
        return;
      }
      
      // ファイル別完全性チェック
      if (filename.endsWith('.html')) {
        files[filename] = ensureCompleteHTML(content, filename);
      } else if (filename.endsWith('.js')) {
        files[filename] = ensureCompleteJS(content, filename);
      } else if (filename.endsWith('.css')) {
        files[filename] = ensureCompleteCSS(content, filename);
      }
    });
    
    if (!files['index.html'] || files['index.html'].trim().length === 0) {
      files['index.html'] = generateSafeHTML();
    }
    
    if (!files['script.js'] || files['script.js'].trim().length === 0) {
      files['script.js'] = generateSafeJS();
    }
    
    if (!files['styles.css'] && !files['style.css']) {
      files['styles.css'] = generateSafeCSS();
    }
    
    // 🔧 HTML内にCSSとJSを埋め込む処理
    if (files['index.html']) {
      files['index.html'] = embedFilesInHTML(files['index.html'], files);
    }
    
  }
  
  // HTML完全性保証
  function ensureCompleteHTML(content: string, filename: string): string {
    let html = content;
    
    
    // 基本構造チェック
    if (!html.includes('<!DOCTYPE html>')) {
      html = '<!DOCTYPE html>\n' + html;
    }
    
    if (!html.includes('<html')) {
      html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<html lang="ja">');
    }
    
    if (!html.includes('<head>')) {
      html = html.replace('<html', '<html lang="ja">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>アプリケーション</title>\n</head>\n<body');
    }
    
    if (!html.includes('<body>') && !html.includes('<body ')) {
      html = html.replace('</head>', '</head>\n<body>');
    }
    
    if (!html.includes('</body>')) {
      html += '\n</body>';
    }
    
    if (!html.includes('</html>')) {
      html += '\n</html>';
    }
    
    return html;
  }
  
  // JavaScript完全性保証  
  function ensureCompleteJS(content: string, filename: string): string {
    let js = content;
    
    
    // 危険なパターンチェック
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
        return generateSafeJS();
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
    }
    
    if (missingParens > 0) {
      js += ')'.repeat(missingParens);
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
      return generateSafeJS();
    }
    
    return js;
  }
  
  // CSS完全性保証
  function ensureCompleteCSS(content: string, filename: string): string {
    let css = content;
    
    
    // 括弧バランスチェック
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    const missingBraces = openBraces - closeBraces;
    
    if (missingBraces > 0) {
      css += '\n' + '}'.repeat(missingBraces);
    }
    
    return css;
  }
  
  // 結果の検証とサニタイズ
  function validateAndSanitizeResult(result: any, existingFiles: Record<string, string>): CodeGenerationResponse {
    if (!result || typeof result !== 'object') {
      throw new Error('無効な結果オブジェクト');
    }
    
    if (!result.files || typeof result.files !== 'object') {
      throw new Error('ファイルオブジェクトが無効');
    }
    
    // ファイル内容をサニタイズ（既存ファイル以外のみ）
    Object.keys(result.files).forEach(fileName => {
      if (typeof result.files[fileName] !== 'string') {
        delete result.files[fileName];
      } else {
        // 🔒 重要：既存ファイルは短くても削除しない
        const isExistingFile = existingFiles[fileName] && existingFiles[fileName].length > 0;
        
        if (!isExistingFile && result.files[fileName].trim().length < 10) {
          delete result.files[fileName];
        } else if (isExistingFile) {
        } else {
        }
      }
    });
    
    // 🔒 重要：既存ファイルとのマージ（このタイミングで既存ファイルを確実に保持）
    mergeWithExistingFiles(result.files, existingFiles);
    
    // 必須ファイルの保証（既存ファイルがない場合のみ）
    if (Object.keys(existingFiles).length === 0) {
      ensureRequiredFiles(result.files);
    } else {
    }
    
    // 🔧 外部ファイル参照をクリーンアップ
    result.files = cleanExternalReferences(result.files);
    
    // 🔧 重要: 外部参照削除後に、HTMLファイルにCSSとJSを埋め込み
    if (result.files['index.html']) {
      result.files['index.html'] = embedFilesInHTML(result.files['index.html'], result.files);
    }
    
    return {
      files: result.files,
      description: result.description || 'AI改善アプリケーション',
      instructions: result.instructions || '改善されたアプリケーションです',
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
      const result = strategy.fn();
      
      // 結果検証
      if (!result.files || Object.keys(result.files).length === 0) {
        throw new Error('ファイルが生成されていません');
      }
      
      if (!result.files['index.html']) {
        throw new Error('index.htmlが見つかりません');
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
    }
  }
  
  // すべての戦略が失敗した場合
  console.error('❌ 全ての抽出戦略が失敗');
  console.error('❌ 最終エラー:', lastError?.message);
  
  throw new Error(`JSON解析に失敗しました: ${lastError?.message || 'Unknown error'}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalCode, improvementRequest, framework = 'react', model = 'claude-3-7-sonnet-20250219', language = 'ja' } = req.body as CodeImprovementRequest;

    if (!originalCode || !improvementRequest) {
      return res.status(400).json({ error: 'Original code and improvement request are required' });
    }



    let result: CodeGenerationResponse;
    
    // Use Claude only - remove all Gemini references
    try {
      const prompt = generateImprovementPrompt(originalCode, improvementRequest, framework, model, language);
      const claudeResponse = await callClaudeAPI(prompt, model);
      result = extractAndFixJSON(claudeResponse, originalCode);
    } catch (claudeError) {
      console.error(`❌ Claude コード改善エラー:`, claudeError);
      
      // Use fallback
      result = createFallbackResponse(framework, model, originalCode);
    }

    if (!result.files || Object.keys(result.files).length === 0) {
      console.error('❌ 最終検証失敗: ファイルが生成されていません');
      result = createFallbackResponse(framework, model, originalCode);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ 致命的エラー:', error);
    
    // 最後の手段としてフォールバック
    const fallbackResult = createFallbackResponse(
      req.body?.framework || 'vanilla',
      req.body?.model || 'unknown',
      req.body?.originalCode
    );
    
    res.status(200).json(fallbackResult);
  }
}

// ファイルの検証と補完を行う関数
function validateAndCompleteFiles(result: CodeGenerationResponse, framework: string, model: string): CodeGenerationResponse {
  
  if (!result.files) {
    result.files = {};
  }
  
  // 必須ファイルの確認と補完
  if (!result.files['index.html']) {
    result.files['index.html'] = generateSafeHTML();
  }
  
  if (!result.files['script.js']) {
    result.files['script.js'] = generateSafeJS();
  }
  
  if (!result.files['styles.css'] && !result.files['style.css']) {
    result.files['styles.css'] = generateSafeCSS();
  }
  
  // JavaScriptファイルの構文チェック
  Object.keys(result.files).forEach(fileName => {
    if (fileName.endsWith('.js')) {
      const jsContent = result.files[fileName];
      
      // 危険なパターンをチェック
      if (jsContent.includes('Unexpected token') || 
          jsContent.includes('SyntaxError') ||
          jsContent.match(/^\s*[\{\[]/) || // ファイルがJSONで始まっている
          jsContent.includes('undefined') && jsContent.includes('syntax')
      ) {
        result.files[fileName] = generateSafeJS();
      }
    }
  });
  
  return result;
}

// 安全なHTMLファイル生成
function generateSafeHTML(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Todo App - 高機能タスク管理</title>
    <!-- 🔧 外部CSS参照なし - すべてインライン化済み -->
    <style>
        /* ===== Modern Todo App Styles - v0レベル高品質デザイン ===== */
        
        /* CSS変数（カスタムプロパティ）でテーマ管理 */
        :root {
          /* カラーパレット */
          --primary-color: #6366f1;
          --primary-hover: #5855eb;
          --primary-light: #e0e7ff;
          --secondary-color: #64748b;
          --success-color: #10b981;
          --success-light: #d1fae5;
          --danger-color: #ef4444;
          --danger-light: #fee2e2;
          --warning-color: #f59e0b;
          --warning-light: #fef3c7;
          
          /* ニュートラルカラー */
          --white: #ffffff;
          --gray-50: #f8fafc;
          --gray-100: #f1f5f9;
          --gray-200: #e2e8f0;
          --gray-300: #cbd5e1;
          --gray-400: #94a3b8;
          --gray-500: #64748b;
          --gray-600: #475569;
          --gray-700: #334155;
          --gray-800: #1e293b;
          --gray-900: #0f172a;
          
          /* スペーシング */
          --spacing-xs: 0.25rem;
          --spacing-sm: 0.5rem;
          --spacing-md: 1rem;
          --spacing-lg: 1.5rem;
          --spacing-xl: 2rem;
          --spacing-2xl: 3rem;
          --spacing-3xl: 4rem;
          
          /* タイポグラフィ */
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-size-2xl: 1.5rem;
          --font-size-3xl: 1.875rem;
          --font-size-4xl: 2.25rem;
          
          /* 境界線 */
          --border-radius-sm: 0.375rem;
          --border-radius-md: 0.5rem;
          --border-radius-lg: 0.75rem;
          --border-radius-xl: 1rem;
          --border-width: 1px;
          
          /* シャドウ */
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          
          /* トランジション */
          --transition-fast: 150ms ease-out;
          --transition-normal: 250ms ease-out;
          --transition-slow: 350ms ease-out;
        }

        /* Reset & Base Styles */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: var(--gray-900);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            position: relative;
            overflow-x: hidden;
        }

        /* Background Animation */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
            pointer-events: none;
            z-index: -1;
        }

        /* Main Container */
        .app-container {
            background: var(--white);
            backdrop-filter: blur(20px);
            border-radius: var(--border-radius-xl);
            padding: var(--spacing-2xl);
            width: 100%;
            max-width: 600px;
            box-shadow: var(--shadow-xl);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .app-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--warning-color));
            border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
        }

        /* Header Section */
        .header {
            text-align: center;
            margin-bottom: var(--spacing-2xl);
            padding-bottom: var(--spacing-lg);
            border-bottom: 1px solid var(--gray-200);
        }

        .app-title {
            font-size: var(--font-size-3xl);
            font-weight: 800;
            margin-bottom: var(--spacing-sm);
            background: linear-gradient(135deg, var(--primary-color), var(--success-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }

        .app-subtitle {
            color: var(--gray-600);
            font-size: var(--font-size-base);
            font-weight: 500;
        }

        /* Stats Section */
        .stats-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-xl);
        }

        .stat-card {
            background: var(--gray-50);
            padding: var(--spacing-lg);
            border-radius: var(--border-radius-lg);
            text-align: center;
            transition: var(--transition-normal);
            border: 1px solid var(--gray-200);
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .stat-value {
            font-size: var(--font-size-2xl);
            font-weight: 700;
            color: var(--primary-color);
            display: block;
        }

        .stat-label {
            font-size: var(--font-size-sm);
            color: var(--gray-600);
            margin-top: var(--spacing-xs);
        }

        /* Form Section */
        .todo-form {
            display: flex;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-xl);
            position: relative;
        }

        .input-container {
            flex: 1;
            position: relative;
        }

        #todoInput {
            width: 100%;
            padding: var(--spacing-lg) var(--spacing-xl);
            border: 2px solid var(--gray-200);
            border-radius: var(--border-radius-lg);
            font-size: var(--font-size-base);
            font-family: var(--font-family);
            transition: var(--transition-normal);
            background: var(--white);
            outline: none;
        }

        #todoInput:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px var(--primary-light);
            transform: translateY(-1px);
        }

        #todoInput::placeholder {
            color: var(--gray-400);
        }

        .add-button {
            padding: var(--spacing-lg) var(--spacing-xl);
            background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
            color: var(--white);
            border: none;
            border-radius: var(--border-radius-lg);
            font-size: var(--font-size-base);
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-normal);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            min-width: 120px;
            justify-content: center;
        }

        .add-button:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
            background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
        }

        .add-button:active {
            transform: translateY(0);
        }

        /* Filter Section */
        .filter-section {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-xl);
            justify-content: center;
            flex-wrap: wrap;
        }

        .filter-btn {
            padding: var(--spacing-sm) var(--spacing-lg);
            border: 2px solid var(--gray-200);
            background: var(--white);
            border-radius: var(--border-radius-md);
            font-size: var(--font-size-sm);
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition-normal);
            color: var(--gray-600);
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }

        .filter-btn:hover {
            border-color: var(--primary-color);
            color: var(--primary-color);
            transform: translateY(-1px);
        }

        .filter-btn.active {
            background: var(--primary-color);
            border-color: var(--primary-color);
            color: var(--white);
            box-shadow: var(--shadow-md);
        }

        /* Todo List */
        .todo-list {
            list-style: none;
            margin-bottom: var(--spacing-xl);
            max-height: 400px;
            overflow-y: auto;
            padding-right: var(--spacing-xs);
        }

        /* Custom Scrollbar */
        .todo-list::-webkit-scrollbar {
            width: 6px;
        }

        .todo-list::-webkit-scrollbar-track {
            background: var(--gray-100);
            border-radius: 3px;
        }

        .todo-list::-webkit-scrollbar-thumb {
            background: var(--gray-300);
            border-radius: 3px;
        }

        .todo-list::-webkit-scrollbar-thumb:hover {
            background: var(--gray-400);
        }

        .todo-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-lg);
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--border-radius-lg);
            margin-bottom: var(--spacing-md);
            transition: var(--transition-normal);
            position: relative;
            overflow: hidden;
        }

        .todo-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--primary-color);
            transform: scaleY(0);
            transition: var(--transition-normal);
        }

        .todo-item:hover {
            border-color: var(--gray-300);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .todo-item:hover::before {
            transform: scaleY(1);
        }

        .todo-item.completed {
            opacity: 0.7;
            background: var(--gray-50);
        }

        .todo-item.completed::before {
            background: var(--success-color);
            transform: scaleY(1);
        }

        .todo-content {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            flex: 1;
            min-width: 0;
        }

        .toggle-btn {
            background: none;
            border: 2px solid var(--gray-300);
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            transition: var(--transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .toggle-btn:hover {
            border-color: var(--success-color);
            transform: scale(1.1);
        }

        .todo-item.completed .toggle-btn {
            background: var(--success-color);
            border-color: var(--success-color);
            color: var(--white);
        }

        .todo-text {
            font-size: var(--font-size-base);
            color: var(--gray-800);
            flex: 1;
            word-break: break-word;
            line-height: 1.5;
        }

        .todo-item.completed .todo-text {
            text-decoration: line-through;
            color: var(--gray-500);
        }

        .todo-actions {
            display: flex;
            gap: var(--spacing-sm);
            opacity: 0;
            transition: var(--transition-normal);
        }

        .todo-item:hover .todo-actions {
            opacity: 1;
        }

        .action-btn {
            background: none;
            border: none;
            padding: var(--spacing-sm);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            transition: var(--transition-fast);
            color: var(--gray-400);
            font-size: var(--font-size-lg);
        }

        .action-btn:hover {
            color: var(--danger-color);
            background: var(--danger-light);
            transform: scale(1.1);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: var(--spacing-3xl) var(--spacing-lg);
            color: var(--gray-500);
            background: var(--gray-50);
            border-radius: var(--border-radius-lg);
            border: 2px dashed var(--gray-200);
        }

        .empty-icon {
            font-size: var(--font-size-4xl);
            margin-bottom: var(--spacing-lg);
            opacity: 0.5;
        }

        .empty-title {
            font-size: var(--font-size-lg);
            font-weight: 600;
            margin-bottom: var(--spacing-sm);
            color: var(--gray-700);
        }

        .empty-description {
            font-size: var(--font-size-sm);
            color: var(--gray-500);
        }

        /* Progress Bar */
        .progress-section {
            margin-top: var(--spacing-xl);
            padding-top: var(--spacing-lg);
            border-top: 1px solid var(--gray-200);
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-md);
        }

        .progress-title {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--gray-700);
        }

        .progress-percentage {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--primary-color);
        }

        .progress-bar {
            height: 8px;
            background: var(--gray-200);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-color), var(--success-color));
            border-radius: 4px;
            transition: width var(--transition-slow);
            position: relative;
        }

        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: var(--spacing-md);
            }
            
            .app-container {
                padding: var(--spacing-lg);
            }
            
            .app-title {
                font-size: var(--font-size-2xl);
            }
            
            .stats-section {
                grid-template-columns: 1fr;
                gap: var(--spacing-sm);
            }
            
            .todo-form {
                flex-direction: column;
            }
            
            .filter-section {
                justify-content: stretch;
            }
            
            .filter-btn {
                flex: 1;
                justify-content: center;
            }
            
            .todo-actions {
                opacity: 1;
            }
        }

        @media (max-width: 480px) {
            .app-container {
                padding: var(--spacing-md);
            }
            
            .todo-item {
                padding: var(--spacing-md);
            }
        }

        /* Animation Classes */
        @keyframes slideIn {
            from { 
                opacity: 0; 
                transform: translateY(20px); 
            }
            to { 
                opacity: 1; 
                transform: translateY(0); 
            }
        }

        .slide-in {
            animation: slideIn var(--transition-normal) ease-out;
        }

        @keyframes fadeOut {
            from { 
                opacity: 1; 
                transform: scale(1); 
            }
            to { 
                opacity: 0; 
                transform: scale(0.95); 
            }
        }

        .fade-out {
            animation: fadeOut var(--transition-normal) ease-out forwards;
        }

        /* Loading State */
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        .loading .add-button {
            position: relative;
        }

        .loading .add-button::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="header">
            <h1 class="app-title">✨ Modern Todo</h1>
            <p class="app-subtitle">Beautiful & Powerful Task Management</p>
        </div>
        
        <div class="stats-section">
            <div class="stat-card">
                <span class="stat-value" id="totalCount">0</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat-card">
                <span class="stat-value" id="activeCount">0</span>
                <span class="stat-label">Active</span>
            </div>
            <div class="stat-card">
                <span class="stat-value" id="completedCount">0</span>
                <span class="stat-label">Completed</span>
            </div>
        </div>
        
        <form id="todoForm" class="todo-form">
            <div class="input-container">
                <input type="text" id="todoInput" placeholder="What needs to be done?" required autocomplete="off">
            </div>
            <button type="submit" class="add-button">
                <span>Add Task</span>
            </button>
        </form>
        
        <div class="filter-section">
            <button class="filter-btn active" data-filter="all">
                <span>📋</span> All
            </button>
            <button class="filter-btn" data-filter="active">
                <span>⏳</span> Active
            </button>
            <button class="filter-btn" data-filter="completed">
                <span>✅</span> Completed
            </button>
        </div>
        
        <ul id="todoList" class="todo-list"></ul>
        
        <div class="progress-section">
            <div class="progress-header">
                <span class="progress-title">Progress</span>
                <span class="progress-percentage" id="progressPercentage">0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
            </div>
        </div>
    </div>
    
    <!-- 🔧 外部JS参照なし - すべてインライン化済み -->
    <script>
        // Modern Todo App JavaScript - v0レベル高品質実装
        class ModernTodoApp {
          constructor() {
            this.todos = this.loadTodos();
            this.filter = 'all';
            this.isLoading = false;
            this.init();
          }

          init() {
            this.bindEvents();
            this.render();
            this.updateStats();
          }

          loadTodos() {
            try {
              const stored = localStorage.getItem('modern-todos');
              return stored ? JSON.parse(stored) : [];
            } catch (e) {
              return [];
            }
          }

          saveTodos() {
            try {
              localStorage.setItem('modern-todos', JSON.stringify(this.todos));
            } catch (e) {
            }
          }

          bindEvents() {
            const form = document.getElementById('todoForm');
            const input = document.getElementById('todoInput');
            const filterButtons = document.querySelectorAll('.filter-btn');

            if (form) {
              form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (!this.isLoading) {
                  this.addTodo();
                }
              });
            }

            if (input) {
              input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                  input.blur();
                }
              });
            }

            filterButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.setFilter(e.currentTarget.dataset.filter);
              });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
              if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                  case '1':
                    e.preventDefault();
                    this.setFilter('all');
                    break;
                  case '2':
                    e.preventDefault();
                    this.setFilter('active');
                    break;
                  case '3':
                    e.preventDefault();
                    this.setFilter('completed');
                    break;
                }
              }
            });
          }

          async addTodo() {
            const input = document.getElementById('todoInput');
            if (!input) return;

            const text = input.value.trim();
            if (!text) return;

            this.setLoading(true);

            // Simulate async operation for better UX
            await new Promise(resolve => setTimeout(resolve, 300));

            const todo = {
              id: Date.now().toString(),
              text: text,
              completed: false,
              createdAt: new Date().toISOString(),
              priority: 'normal'
            };
            
            this.todos.unshift(todo);
            input.value = '';
            this.saveTodos();
            this.render();
            this.updateStats();
            
            this.setLoading(false);

            // Focus back to input for continuous adding
            setTimeout(() => input.focus(), 100);
          }

          toggleTodo(id) {
            const todo = this.todos.find(t => t.id === id);
            if (todo) {
              todo.completed = !todo.completed;
              todo.completedAt = todo.completed ? new Date().toISOString() : null;
              
              this.saveTodos();
              this.render();
              this.updateStats();
              
              // Add animation class
              const element = document.querySelector(\`[data-todo-id="\${id}"]\`);
              if (element) {
                element.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  element.style.transform = '';
                }, 150);
              }
            }
          }

          deleteTodo(id) {
            const element = document.querySelector(\`[data-todo-id="\${id}"]\`);
            if (element) {
              element.classList.add('fade-out');
              setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
                this.updateStats();
              }, 250);
            }
          }

          setFilter(filter) {
            this.filter = filter;
            
            // Update active filter button
            document.querySelectorAll('.filter-btn').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.filter === filter);
            });
            
            this.render();
          }

          getFilteredTodos() {
            switch (this.filter) {
              case 'active':
                return this.todos.filter(t => !t.completed);
              case 'completed':
                return this.todos.filter(t => t.completed);
              default:
                return this.todos;
            }
          }

          setLoading(loading) {
            this.isLoading = loading;
            const container = document.querySelector('.app-container');
            if (container) {
              container.classList.toggle('loading', loading);
            }
          }

          updateStats() {
            const total = this.todos.length;
            const completed = this.todos.filter(t => t.completed).length;
            const active = total - completed;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Update stat cards
            const totalElement = document.getElementById('totalCount');
            const activeElement = document.getElementById('activeCount');
            const completedElement = document.getElementById('completedCount');
            const progressElement = document.getElementById('progressFill');
            const percentageElement = document.getElementById('progressPercentage');

            if (totalElement) totalElement.textContent = total.toString();
            if (activeElement) activeElement.textContent = active.toString();
            if (completedElement) completedElement.textContent = completed.toString();
            if (progressElement) progressElement.style.width = \`\${percentage}%\`;
            if (percentageElement) percentageElement.textContent = \`\${percentage}%\`;
          }

          render() {
            const todoList = document.getElementById('todoList');
            if (!todoList) return;

            const filteredTodos = this.getFilteredTodos();
            
            if (filteredTodos.length === 0) {
              todoList.innerHTML = this.renderEmptyState();
              return;
            }

            todoList.innerHTML = filteredTodos
              .map(todo => this.renderTodoItem(todo))
              .join('');

            // Add slide-in animation to new items
            todoList.querySelectorAll('.todo-item').forEach((item, index) => {
              item.style.animationDelay = \`\${index * 50}ms\`;
              item.classList.add('slide-in');
            });
          }

          renderEmptyState() {
            const messages = {
              all: {
                icon: '📝',
                title: 'No tasks yet',
                description: 'Add your first task to get started!'
              },
              active: {
                icon: '🎉',
                title: 'All caught up!',
                description: 'No active tasks remaining.'
              },
              completed: {
                icon: '📋',
                title: 'No completed tasks',
                description: 'Complete some tasks to see them here.'
              }
            };

            const message = messages[this.filter] || messages.all;

            return \`
              <li class="empty-state">
                <div class="empty-icon">\${message.icon}</div>
                <div class="empty-title">\${message.title}</div>
                <div class="empty-description">\${message.description}</div>
              </li>
            \`;
          }

          renderTodoItem(todo) {
            const completedClass = todo.completed ? ' completed' : '';
            const checkIcon = todo.completed ? '✓' : '';
            
            return \`
              <li class="todo-item\${completedClass}" data-todo-id="\${todo.id}">
                <div class="todo-content">
                  <button class="toggle-btn" onclick="app.toggleTodo('\${todo.id}')" title="Toggle completion">
                    \${checkIcon}
                  </button>
                  <span class="todo-text">\${this.escapeHtml(todo.text)}</span>
                </div>
                <div class="todo-actions">
                  <button class="action-btn" onclick="app.deleteTodo('\${todo.id}')" title="Delete task">
                    🗑️
                  </button>
                </div>
              </li>
            \`;
          }

          escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
          }

          // Utility methods for enhanced functionality
          clearCompleted() {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveTodos();
            this.render();
            this.updateStats();
          }

          markAllCompleted() {
            const hasIncomplete = this.todos.some(t => !t.completed);
            this.todos.forEach(todo => {
              todo.completed = hasIncomplete;
              todo.completedAt = hasIncomplete ? new Date().toISOString() : null;
            });
            this.saveTodos();
            this.render();
            this.updateStats();
          }
        }

        // Initialize app
        let app;
        document.addEventListener('DOMContentLoaded', function() {
          app = new ModernTodoApp();
        });

        // Global error handling
        window.addEventListener('error', function(e) {
          console.error('Application Error:', e.error);
        });

        // Performance monitoring
        window.addEventListener('load', function() {
        });
    </script>
</body>
</html>`;
}

// フォールバック応答を生成（既存コード保持版）
function createFallbackResponse(framework: string, model: string, originalCode?: string): CodeGenerationResponse {
  const files: Record<string, string> = {};
  
  
  // 既存コードの解析と保持
  let existingFiles: Record<string, string> = {};
  if (originalCode) {
    try {
      const parsed = JSON.parse(originalCode);
      if (parsed.files && typeof parsed.files === 'object') {
        existingFiles = parsed.files;
      }
    } catch {
      // JSONでない場合は、単一ファイルとして扱う
      if (originalCode.includes('<!DOCTYPE html>') || originalCode.includes('<html')) {
        existingFiles['index.html'] = originalCode;
      } else if (originalCode.includes('function') || originalCode.includes('const') || originalCode.includes('let')) {
        existingFiles['script.js'] = originalCode;
      } else if (originalCode.includes('{') && originalCode.includes('}') && originalCode.includes(':')) {
        existingFiles['styles.css'] = originalCode;
      }
    }
  }
  
  // 🔒 重要: 既存ファイルがある場合は、絶対に置き換えない
  if (Object.keys(existingFiles).length > 0) {
    
    // 既存ファイルをそのまま使用
    Object.keys(existingFiles).forEach(filename => {
      files[filename] = existingFiles[filename] + '\n\n<!-- 改善処理: フォールバック実行時も既存コードを完全保持 -->';
    });
    
    // 🔧 外部ファイル参照をクリーンアップ
    const cleanedFiles = cleanExternalReferences(files);
    
    // 🔧 重要: 外部参照削除後に、HTMLファイルにCSSとJSを埋め込み（既存ファイル保持時）
    if (cleanedFiles['index.html']) {
      
      // 他のCSSやJSファイルを埋め込み用に準備
      const embedFiles: Record<string, string> = {};
      Object.keys(cleanedFiles).forEach(filename => {
        if (filename !== 'index.html') {
          embedFiles[filename] = cleanedFiles[filename];
        }
      });
      
      cleanedFiles['index.html'] = embedFilesInHTML(cleanedFiles['index.html'], embedFiles);
    }
    
    return {
      files: cleanedFiles,
      description: '既存コードを完全保持しました。改善処理中にエラーが発生しましたが、元のコードは損失していません。',
      instructions: '既存の機能はそのまま使用でき、コードも完全に保持されています。',
      framework,
      language: 'javascript',
      styling: 'css',
      usedModel: model
    };
  }
  
  // 既存ファイルがない場合のみ、新規フォールバック生成
  
  files['index.html'] = generateSafeHTML();
  files['script.js'] = generateSafeJS();
  files['styles.css'] = generateSafeCSS();
  
  // 🔧 外部ファイル参照をクリーンアップ
  const cleanedFiles = cleanExternalReferences(files);
  
  // 🔧 重要: 外部参照削除後に、HTMLファイルにCSSとJSを埋め込み（新規生成時）
  if (cleanedFiles['index.html']) {
    
    // 他のCSSやJSファイルを埋め込み用に準備
    const embedFiles: Record<string, string> = {};
    Object.keys(cleanedFiles).forEach(filename => {
      if (filename !== 'index.html') {
        embedFiles[filename] = cleanedFiles[filename];
      }
    });
    
    cleanedFiles['index.html'] = embedFilesInHTML(cleanedFiles['index.html'], embedFiles);
  }
  
  return {
    files: cleanedFiles,
    description: '新規Todoアプリケーションを生成しました。',
    instructions: 'タスクの追加、削除、完了状態の切り替えができます。',
    framework,
    language: 'javascript',
    styling: 'css',
    usedModel: model
  };
}

// 安全なJavaScriptファイル生成（修正版）
function generateSafeJS(): string {
  return `// Modern Todo App JavaScript - v0レベル高品質実装
class ModernTodoApp {
  constructor() {
    this.todos = this.loadTodos();
    this.filter = 'all';
    this.isLoading = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.updateStats();
  }

  loadTodos() {
    try {
      const stored = localStorage.getItem('modern-todos');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveTodos() {
    try {
      localStorage.setItem('modern-todos', JSON.stringify(this.todos));
    } catch (e) {
    }
  }

  bindEvents() {
    const form = document.getElementById('todoForm');
    const input = document.getElementById('todoInput');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!this.isLoading) {
          this.addTodo();
        }
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          input.blur();
        }
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setFilter(e.currentTarget.dataset.filter);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.setFilter('all');
            break;
          case '2':
            e.preventDefault();
            this.setFilter('active');
            break;
          case '3':
            e.preventDefault();
            this.setFilter('completed');
            break;
        }
      }
    });
  }

  async addTodo() {
    const input = document.getElementById('todoInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    this.setLoading(true);

    // Simulate async operation for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const todo = {
      id: Date.now().toString(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: 'normal'
    };
    
    this.todos.unshift(todo);
    input.value = '';
    this.saveTodos();
    this.render();
    this.updateStats();
    
    this.setLoading(false);

    // Focus back to input for continuous adding
    setTimeout(() => input.focus(), 100);
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completedAt = todo.completed ? new Date().toISOString() : null;
      
      this.saveTodos();
      this.render();
      this.updateStats();
      
      // Add animation class
      const element = document.querySelector(\`[data-todo-id="\${id}"]\`);
      if (element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
      }
    }
  }

  deleteTodo(id) {
    const element = document.querySelector(\`[data-todo-id="\${id}"]\`);
    if (element) {
      element.classList.add('fade-out');
      setTimeout(() => {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
      }, 250);
    }
  }

  setFilter(filter) {
    this.filter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    this.render();
  }

  getFilteredTodos() {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const container = document.querySelector('.app-container');
    if (container) {
      container.classList.toggle('loading', loading);
    }
  }

  updateStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update stat cards
    const totalElement = document.getElementById('totalCount');
    const activeElement = document.getElementById('activeCount');
    const completedElement = document.getElementById('completedCount');
    const progressElement = document.getElementById('progressFill');
    const percentageElement = document.getElementById('progressPercentage');

    if (totalElement) totalElement.textContent = total.toString();
    if (activeElement) activeElement.textContent = active.toString();
    if (completedElement) completedElement.textContent = completed.toString();
    if (progressElement) progressElement.style.width = \`\${percentage}%\`;
    if (percentageElement) percentageElement.textContent = \`\${percentage}%\`;
  }

  render() {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;

    const filteredTodos = this.getFilteredTodos();
    
    if (filteredTodos.length === 0) {
      todoList.innerHTML = this.renderEmptyState();
      return;
    }

    todoList.innerHTML = filteredTodos
      .map(todo => this.renderTodoItem(todo))
      .join('');

    // Add slide-in animation to new items
    todoList.querySelectorAll('.todo-item').forEach((item, index) => {
      item.style.animationDelay = \`\${index * 50}ms\`;
      item.classList.add('slide-in');
    });
  }

  renderEmptyState() {
    const messages = {
      all: {
        icon: '📝',
        title: 'No tasks yet',
        description: 'Add your first task to get started!'
      },
      active: {
        icon: '🎉',
        title: 'All caught up!',
        description: 'No active tasks remaining.'
      },
      completed: {
        icon: '📋',
        title: 'No completed tasks',
        description: 'Complete some tasks to see them here.'
      }
    };

    const message = messages[this.filter] || messages.all;

    return \`
      <li class="empty-state">
        <div class="empty-icon">\${message.icon}</div>
        <div class="empty-title">\${message.title}</div>
        <div class="empty-description">\${message.description}</div>
      </li>
    \`;
  }

  renderTodoItem(todo) {
    const completedClass = todo.completed ? ' completed' : '';
    const checkIcon = todo.completed ? '✓' : '';
    
    return \`
      <li class="todo-item\${completedClass}" data-todo-id="\${todo.id}">
        <div class="todo-content">
          <button class="toggle-btn" onclick="app.toggleTodo('\${todo.id}')" title="Toggle completion">
            \${checkIcon}
          </button>
          <span class="todo-text">\${this.escapeHtml(todo.text)}</span>
        </div>
        <div class="todo-actions">
          <button class="action-btn" onclick="app.deleteTodo('\${todo.id}')" title="Delete task">
            🗑️
          </button>
        </div>
      </li>
    \`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility methods for enhanced functionality
  clearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.saveTodos();
    this.render();
    this.updateStats();
  }

  markAllCompleted() {
    const hasIncomplete = this.todos.some(t => !t.completed);
    this.todos.forEach(todo => {
      todo.completed = hasIncomplete;
      todo.completedAt = hasIncomplete ? new Date().toISOString() : null;
    });
    this.saveTodos();
    this.render();
    this.updateStats();
  }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', function() {
  app = new ModernTodoApp();
});

// Global error handling
window.addEventListener('error', function(e) {
  console.error('Application Error:', e.error);
});

// Performance monitoring
window.addEventListener('load', function() {
});`;
}

// 安全なCSSファイル生成
function generateSafeCSS(): string {
  return `/* ===== Modern Todo App Styles - v0レベル高品質デザイン ===== */

/* CSS変数（カスタムプロパティ）でテーマ管理 */
:root {
  /* カラーパレット */
  --primary-color: #6366f1;
  --primary-hover: #5855eb;
  --primary-light: #e0e7ff;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --success-light: #d1fae5;
  --danger-color: #ef4444;
  --danger-light: #fee2e2;
  --warning-color: #f59e0b;
  --warning-light: #fef3c7;
  
  /* ニュートラルカラー */
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  
  /* スペーシング */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;
  
  /* タイポグラフィ */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* 境界線 */
  --border-radius-sm: 0.375rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
  --border-width: 1px;
  
  /* シャドウ */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* トランジション */
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;
  --transition-slow: 350ms ease-out;
}

/* Reset & Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--gray-900);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  position: relative;
  overflow-x: hidden;
}

/* Background Animation */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  pointer-events: none;
  z-index: -1;
}

/* Main Container */
.app-container {
  background: var(--white);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  width: 100%;
  max-width: 600px;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.app-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--warning-color));
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

/* Header Section */
.header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.app-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  margin-bottom: var(--spacing-sm);
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.app-subtitle {
  color: var(--gray-600);
  font-size: var(--font-size-base);
  font-weight: 500;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--gray-50);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  text-align: center;
  transition: var(--transition-normal);
  border: 1px solid var(--gray-200);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--primary-color);
  display: block;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  margin-top: var(--spacing-xs);
}

/* Form Section */
.todo-form {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.input-container {
  flex: 1;
  position: relative;
}

#todoInput {
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl);
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  transition: var(--transition-normal);
  background: var(--white);
  outline: none;
}

#todoInput:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
  transform: translateY(-1px);
}

#todoInput::placeholder {
  color: var(--gray-400);
}

.add-button {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  justify-content: center;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
}

.add-button:active {
  transform: translateY(0);
}

/* Filter Section */
.filter-section {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  justify-content: center;
  flex-wrap: wrap;
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 2px solid var(--gray-200);
  background: var(--white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.filter-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-1px);
}

.filter-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--white);
  box-shadow: var(--shadow-md);
}

/* Todo List */
.todo-list {
  list-style: none;
  margin-bottom: var(--spacing-xl);
  max-height: 400px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

/* Custom Scrollbar */
.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 3px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-md);
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.todo-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary-color);
  transform: scaleY(0);
  transition: var(--transition-normal);
}

.todo-item:hover {
  border-color: var(--gray-300);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.todo-item:hover::before {
  transform: scaleY(1);
}

.todo-item.completed {
  opacity: 0.7;
  background: var(--gray-50);
}

.todo-item.completed::before {
  background: var(--success-color);
  transform: scaleY(1);
}

.todo-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.toggle-btn {
  background: none;
  border: 2px solid var(--gray-300);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toggle-btn:hover {
  border-color: var(--success-color);
  transform: scale(1.1);
}

.todo-item.completed .toggle-btn {
  background: var(--success-color);
  border-color: var(--success-color);
  color: var(--white);
}

.todo-text {
  font-size: var(--font-size-base);
  color: var(--gray-800);
  flex: 1;
  word-break: break-word;
  line-height: 1.5;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--gray-500);
}

.todo-actions {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: var(--transition-normal);
}

.todo-item:hover .todo-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
  color: var(--gray-400);
  font-size: var(--font-size-lg);
}

.action-btn:hover {
  color: var(--danger-color);
  background: var(--danger-light);
  transform: scale(1.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) var(--spacing-lg);
  color: var(--gray-500);
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  border: 2px dashed var(--gray-200);
}

.empty-icon {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-lg);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: var(--gray-700);
}

.empty-description {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}

/* Progress Bar */
.progress-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.progress-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--gray-700);
}

.progress-percentage {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary-color);
}

.progress-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  border-radius: 4px;
  transition: width var(--transition-slow);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Responsive Design */
@media (max-width: 768px) {
  body {
    padding: var(--spacing-md);
  }
  
  .app-container {
    padding: var(--spacing-lg);
  }
  
  .app-title {
    font-size: var(--font-size-2xl);
  }
  
  .stats-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .todo-form {
    flex-direction: column;
  }
  
  .filter-section {
    justify-content: stretch;
  }
  
  .filter-btn {
    flex: 1;
    justify-content: center;
  }
  
  .todo-actions {
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: var(--spacing-md);
  }
  
  .todo-item {
    padding: var(--spacing-md);
  }
}

/* Animation Classes */
@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.slide-in {
  animation: slideIn var(--transition-normal) ease-out;
}

@keyframes fadeOut {
  from { 
    opacity: 1; 
    transform: scale(1); 
  }
  to { 
    opacity: 0; 
    transform: scale(0.95); 
  }
}

.fade-out {
  animation: fadeOut var(--transition-normal) ease-out forwards;
}

/* Loading State */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

.loading .add-button {
  position: relative;
}

.loading .add-button::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}`;
}

// Remove Gemini API function
async function generateCodeWithClaude(request: any): Promise<CodeGenerationResponse> {
  const prompt = generateImprovementPrompt(
    request.originalCode,
    request.improvementRequest,
    request.framework || 'react',
    'claude-3-7-sonnet-20250219',
    request.language || 'ja'
  );
  
  const response = await callClaudeAPI(prompt, 'claude-3-7-sonnet-20250219');
  return extractAndFixJSON(response, request.originalCode);
}
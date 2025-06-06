import { UIGenerationResponse } from '../utils/types';
import { extractWithBackticks } from './backtick-parser';
import { extractFieldsWithRegex } from './regex-parser';
import { cleanupJsonString } from './json-cleaner';
import { generateBasicInteractions } from '../generators/interactions';

export function extractJSONFromResponse(text: string): UIGenerationResponse {
  console.log('🔍 Extracting JSON from response...');
  console.log('📄 Response text length:', text.length);
  console.log('📄 Response preview (first 500 chars):', text.substring(0, 500));
  
  return extractSinglePageJSONFromResponse(text);
}

function extractSinglePageJSONFromResponse(text: string): UIGenerationResponse {
  console.log('🔍 Extracting single page JSON...');
  
  // 新規追加: 直接JSON形式のレスポンスチェック
  try {
    // テキストが直接JSONで始まる場合（Claudeが直接JSONを返す場合）
    const trimmedText = text.trim();
    if (trimmedText.startsWith('{') && trimmedText.includes('"html"')) {
      console.log('🔍 Attempting direct JSON parse...');
      
      let jsonText = trimmedText;
      
      // 不完全なJSONの修復を試行
      if (!jsonText.endsWith('}')) {
        console.log('⚠️ JSON appears incomplete, attempting to fix...');
        
        // 最後の完全なフィールドを見つける
        const lastCompleteField = jsonText.lastIndexOf('",');
        const lastCompleteFieldAlt = jsonText.lastIndexOf('"}');
        const lastValidPos = Math.max(lastCompleteField, lastCompleteFieldAlt);
        
        if (lastValidPos > 0) {
          // 不完全な部分を削除して閉じ括弧を追加
          if (lastCompleteField > lastCompleteFieldAlt) {
            jsonText = jsonText.substring(0, lastCompleteField + 1) + '}';
          } else {
            jsonText = jsonText.substring(0, lastCompleteFieldAlt + 2) + '}';
          }
          console.log('🔧 Fixed incomplete JSON');
        } else {
          // 最低限HTMLフィールドがあれば抽出を試行
          const htmlMatch = jsonText.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (htmlMatch) {
            const htmlContent = htmlMatch[1];
            console.log('🔧 Extracting HTML from incomplete JSON');
            
            // 基本的なJSON構造を再構築
            jsonText = `{
              "html": "${htmlContent}",
              "css": "",
              "js": "",
              "description": "Generated from incomplete response"
            }`;
          }
        }
      }
      
      try {
        const parsed = JSON.parse(jsonText);
        
        if (parsed.html) {
          console.log('✅ Direct JSON parsing successful');
          
          // CSS/JSが空の場合は自動生成
          let finalCss = parsed.css || '';
          let finalJs = parsed.js || '';
          
          if (!finalCss || finalCss.trim().length < 10) {
            console.log('⚠️ CSS is missing, generating basic styles...');
            finalCss = generateBasicCSS();
          }
          
          if (!finalJs || finalJs.trim().length < 50) {
            console.log('⚠️ JavaScript is missing, adding basic interactions...');
            finalJs = generateBasicInteractions();
          }
          
          return {
            html: parsed.html,
            css: finalCss,
            js: finalJs,
            description: parsed.description || 'Generated UI from Claude'
          };
        }
      } catch (repairParseError) {
        console.log('⚠️ Repaired JSON parsing also failed:', repairParseError);
        
        // 最後の手段: HTMLだけでも抽出
        const htmlMatch = trimmedText.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"(?=\s*[,}])/);
        if (htmlMatch) {
          const htmlContent = htmlMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          console.log('🔧 Emergency HTML extraction successful');
          
          return {
            html: htmlContent,
            css: generateBasicCSS(),
            js: generateBasicInteractions(),
            description: 'Emergency extraction from incomplete response'
          };
        }
      }
    }
  } catch (directParseError) {
    console.log('⚠️ Direct JSON parsing failed, trying other methods...', directParseError);
  }
  
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
  return extractWithMultiplePatterns(text);
}

function extractWithMultiplePatterns(text: string): UIGenerationResponse {
  const jsonPatterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/i,  // ```json ブロック
    /```\s*(\{[\s\S]*?\})\s*```/i,      // ``` ブロック
    /```json\s*([\s\S]*?)```/i,         // ```json ブロック（より寛容）
    /```\s*([\s\S]*?)```/i,             // ``` ブロック（より寛容）
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
  
  // 特別な処理: パターンマッチングが失敗した場合、直接JSON抽出を試行
  if (!jsonText) {
    console.log('🔧 Attempting direct JSON extraction...');
    
    // ```json で始まる場合の特別処理
    if (text.trim().startsWith('```json')) {
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonText = text.substring(startIndex, endIndex + 1);
        patternUsed = 99; // 特別なパターン番号
        console.log('📦 Found JSON with direct extraction');
      }
    }
    
    // まだ見つからない場合、最初の { から最後の } まで抽出
    if (!jsonText) {
      const startIndex = text.indexOf('{');
      const endIndex = text.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonText = text.substring(startIndex, endIndex + 1);
        patternUsed = 100; // 特別なパターン番号
        console.log('📦 Found JSON with fallback extraction');
      }
    }
  }
  
  if (!jsonText) {
    console.error('❌ No JSON structure found in response');
    console.error('🔍 Full response text for debugging:', text);
    throw new Error('Valid JSON not found in response');
  }

  return parseExtractedJSON(jsonText, patternUsed);
}

function parseExtractedJSON(jsonText: string, patternUsed: number): UIGenerationResponse {
  console.log('📄 Raw JSON length:', jsonText.length);
  console.log('📄 Raw JSON preview (first 300 chars):', jsonText.substring(0, 300));
  console.log('📄 Raw JSON preview (last 300 chars):', jsonText.substring(Math.max(0, jsonText.length - 300)));

  try {
    // JSONをクリーンアップ（バッククォートを削除）
    let cleanedJson = cleanupJsonString(jsonText);
    console.log('🧹 Cleaned JSON preview (first 300 chars):', cleanedJson.substring(0, 300));
    
    // 追加の安全性チェック
    cleanedJson = cleanedJson.trim();
    
    // 基本的なJSON構造の検証
    if (!cleanedJson.startsWith('{') || !cleanedJson.endsWith('}')) {
      throw new Error('Invalid JSON structure: must start with { and end with }');
    }
    
    const parsed = JSON.parse(cleanedJson);
    
    // より柔軟な検証: HTMLは必須、CSS/JSは自動生成可能
    if (!parsed.html) {
      console.error('❌ Missing required HTML field');
      throw new Error('Missing required HTML field in response');
    }
    
    // CSS/JSが不足している場合は自動生成
    let finalCss = parsed.css || '';
    let finalJs = parsed.js || '';
    
    if (!finalCss || finalCss.trim().length < 10) {
      console.log('⚠️ CSS is missing or too short, generating basic styles...');
      finalCss = generateBasicCSS();
    }
    
    if (!finalJs || finalJs.trim().length < 50) {
      console.log('⚠️ JavaScript is missing or too short, adding basic interactions...');
      finalJs = generateBasicInteractions();
    }

    console.log('✅ JSON parsing successful');
    return {
      html: parsed.html,
      css: finalCss,
      js: finalJs,
      description: parsed.description || 'Generated UI'
    };
  } catch (error) {
    console.error('❌ JSON parsing error:', error);
    console.error('🔍 Failed JSON text (first 500 chars):', jsonText.substring(0, 500));
    console.error('🔍 Pattern used:', patternUsed);
    
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateBasicCSS(): string {
  return `
/* 基本スタイル */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

button {
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;
}

input, textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}`;
} 
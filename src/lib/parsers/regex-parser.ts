import { UIGenerationResponse } from '../utils/types';
import { generateBasicInteractions } from '../generators/interactions';

export function extractFieldsWithRegex(text: string): UIGenerationResponse | null {
  console.log('🔄 Attempting improved fallback regex extraction...');
  
  // より強力で寛容な正規表現でフィールドを抽出
  const extractField = (fieldName: string): string | null => {
    const patterns = [
      // パターン1: "field": "value" (改行対応、より寛容)
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)(?="\\s*[,}]|$)`, 'i'),
      // パターン2: バッククォート形式
      new RegExp(`"${fieldName}"\\s*:\\s*\`([\\s\\S]*?)\``, 'i'),
      // パターン3: より寛容なパターン（エスケープ対応）
      new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i'),
      // パターン4: 最後の要素（カンマなし）
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)"\\s*}`, 'i'),
      // パターン5: フィールド名前後にスペース
      new RegExp(`"\\s*${fieldName}\\s*"\\s*:\\s*"([\\s\\S]*?)"`, 'i'),
      // パターン6: 非常に寛容なパターン（長いコンテンツ用）
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)(?="\\s*,\\s*"\\w+"|"\\s*}|$)`, 'i'),
      // パターン7: 最後のフィールドの場合
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:}|$)`, 'i')
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
  
  console.log('📋 Improved extraction results:', {
    html: !!html,
    css: !!css,
    js: !!js,
    htmlLength: html?.length || 0,
    cssLength: css?.length || 0,
    jsLength: js?.length || 0
  });
  
  if (html && css) {
    // より安全なエスケープ文字のデコード
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
    
    console.log('✅ Improved regex extraction successful');
    
    // JavaScriptが空または非常に短い場合、基本的なインタラクション機能を追加
    let finalJs = js ? unescapeString(js) : '';
    if (!finalJs || finalJs.trim().length < 50) {
      console.log('⚠️ JavaScript is missing or too short, adding basic interactions...');
      finalJs = generateBasicInteractions();
    }
    
    return {
      html: unescapeString(html),
      css: unescapeString(css),
      js: finalJs,
      description: description ? unescapeString(description) : 'Generated UI'
    };
  }
  
  console.log('❌ Required fields not found in improved regex extraction');
  return null;
} 
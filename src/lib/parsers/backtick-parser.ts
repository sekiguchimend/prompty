import { UIGenerationResponse } from '../utils/types';
import { generateBasicInteractions } from '../generators/interactions';

export function extractWithBackticks(text: string): UIGenerationResponse | null {
  console.log('🔧 Attempting backtick extraction...');
  
  // まず直接的なバッククォートパターンでの抽出を試行
  const extractBacktickField = (fieldName: string): string | null => {
    // より強力なパターンマッチング
    const patterns = [
      // 基本パターン: "field": `content` (改行対応)
      new RegExp(`"${fieldName}"\\s*:\\s*\`([\\s\\S]*?)\`(?=\\s*[,}])`, 'i'),
      // 複数行バッククォート
      new RegExp(`"${fieldName}"\\s*:\\s*\`([\\s\\S]*?)\``, 'i'),
      // 前後にスペースがある場合
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
  
  // 直接抽出を試行
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
  
  if (html && css) {
    console.log('✅ Direct backtick extraction successful');
    
    // JavaScriptが空または非常に短い場合、基本的なインタラクション機能を追加
    let finalJs = js || '';
    if (!finalJs || finalJs.trim().length < 50) {
      console.log('⚠️ JavaScript is missing or too short, adding basic interactions...');
      finalJs = generateBasicInteractions();
    }
    
    return {
      html,
      css,
      js: finalJs,
      description: description || 'Generated UI'
    };
  }
  
  console.log('❌ Backtick extraction failed');
  return null;
} 
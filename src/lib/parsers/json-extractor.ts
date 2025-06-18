import { UIGenerationResponse } from '../utils/types';

export function extractJSONFromResponse(claudeResponse: string): UIGenerationResponse {
  try {
    // Claude APIのレスポンスからJSONブロックを抽出
    const jsonMatch = claudeResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                     claudeResponse.match(/\{[\s\S]*\}/);
    
    let jsonString: string;
    if (jsonMatch) {
      jsonString = jsonMatch[1] || jsonMatch[0];
    } else {
      // JSONブロックが見つからない場合、直接パースを試行
      jsonString = claudeResponse;
    }
    
    // 制御文字をサニタイズ
    const sanitizedJson = jsonString
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 制御文字を削除
      .replace(/\n/g, '\\n')                // 改行をエスケープ
      .replace(/\r/g, '\\r')                // 復帰文字をエスケープ
      .replace(/\t/g, '\\t');               // タブをエスケープ
    
    
    const result = JSON.parse(sanitizedJson);
    
    // 結果の検証
    if (!result.html || !result.css) {
      throw new Error('Invalid response format: missing html or css');
    }
    
    return result;
    
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    
    throw parseError;
  }
}
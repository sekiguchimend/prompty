export function cleanupJsonString(jsonString: string): string {
  console.log('🧹 Starting JSON cleanup...');
  
  let cleaned = jsonString;
  
  // Step 1: 明らかに問題のある制御文字を除去
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 2: バッククォートを安全に変換
  cleaned = cleaned.replace(/`([^`]*(?:`[^`]*)*)`/g, (match, content) => {
    // バッククォート内のコンテンツを安全にエスケープ（順序重要）
    const escaped = content
      .replace(/\\/g, '\\\\')           // バックスラッシュを最初に処理
      .replace(/"/g, '\\"')            // ダブルクォート
      .replace(/\r\n/g, '\\n')         // Windows改行を先に処理
      .replace(/\n/g, '\\n')           // 改行
      .replace(/\r/g, '\\r')           // キャリッジリターン
      .replace(/\t/g, '\\t')           // タブ
      .replace(/\f/g, '\\f')           // フォームフィード
      .replace(/\v/g, '\\v');          // 垂直タブ
    return `"${escaped}"`;
  });
  
  // Step 3: 不完全な文字列を検出して修正
  const stringPattern = /"[^"\\]*(?:\\.[^"\\]*)*"/g;
  const strings = cleaned.match(stringPattern) || [];
  
  // 文字列の終端チェック
  let lastStringEnd = -1;
  for (const str of strings) {
    const index = cleaned.indexOf(str, lastStringEnd + 1);
    lastStringEnd = index + str.length - 1;
  }
  
  // 最後の文字列の後に不完全な文字列がないかチェック
  const afterLastString = cleaned.substring(lastStringEnd + 1);
  const incompleteStringMatch = afterLastString.match(/"[^"]*$/);
  if (incompleteStringMatch) {
    console.log('⚠️ Found incomplete string at end, fixing...');
    const incompleteStart = lastStringEnd + 1 + incompleteStringMatch.index!;
    cleaned = cleaned.substring(0, incompleteStart + incompleteStringMatch[0].length) + '"' +
              cleaned.substring(incompleteStart + incompleteStringMatch[0].length);
  }
  
  // Step 4: 残っている制御文字をUnicodeエスケープに変換
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char: string) => {
    const code = char.charCodeAt(0);
    return '\\u' + code.toString(16).padStart(4, '0');
  });
  
  // Step 5: 不正なエスケープシーケンスを修正
  cleaned = cleaned.replace(/\\(?!["\\/bfnrtv]|u[0-9a-fA-F]{4})/g, '\\\\');
  
  console.log('🧹 JSON cleanup completed');
  return cleaned;
} 
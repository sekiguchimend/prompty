/**
 * Base64エンコードされたデータURLをFileオブジェクトに変換する関数
 * 
 * @param dataUrl - データURL（例: "data:image/png;base64,XXXX..."）
 * @param filename - 生成されるファイルの名前
 * @returns File オブジェクト
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  console.log(`データURLからファイル変換開始: ${filename} (データURL長さ: ${dataUrl.length})`);
  
  try {
    // データURLの形式を確認
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      throw new Error('無効なデータURL形式');
    }
    
    // MIMEタイプを抽出（デフォルトはimage/png）
    let mimeType = dataUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
    
    // MIMEタイプが画像でない場合は強制的に画像に設定
    if (!mimeType.startsWith('image/')) {
      console.warn('不正なMIMEタイプを検出、image/pngに修正:', mimeType);
      mimeType = 'image/png';
    }
    
    // Base64部分を抽出
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Base64データが見つかりませんでした');
    }
    
    // Base64デコード
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    // バイナリデータに変換
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Blobを作成（MIMEタイプを明示的に指定）
    const blob = new Blob([bytes], { type: mimeType });
    
    // Fileオブジェクトを作成
    const file = new File([blob], filename, { type: mimeType });
    
    console.log(`データURLからファイル変換成功: ${JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size
    })}`);
    
    return file;
  } catch (error) {
    console.error('データURL→ファイル変換エラー:', error);
    
    // エラー時はダミーの空画像を返す
    const emptyBlob = new Blob([''], { type: 'image/png' });
    return new File([emptyBlob], filename, { type: 'image/png' });
  }
} 
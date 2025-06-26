import { supabase } from '../lib/supabase-unified';
import { toast } from '../components/ui/use-toast';

/**
 * MIMEタイプからファイル拡張子を取得
 */
export function getFileExtFromMimeType(mimeType: string): string {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff'
  };
  
  return extMap[mimeType] || 'jpg';
}

/**
 * ファイル拡張子からMIMEタイプを取得
 */
export function getMimeTypeFromExt(extension: string): string {
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff'
  };
  
  return mimeMap[extension.toLowerCase()] || 'image/jpeg';
}

/**
 * Supabaseストレージにファイルをアップロード
 */
export async function uploadFileToStorage(
  file: File, 
  bucketName: string = 'prompt-thumbnails',
  customFileName?: string
): Promise<{ url: string | null; error: Error | null }> {
  if (!file) {
    return { url: null, error: new Error('ファイルが選択されていません') };
  }
  
  try {
    // ファイル名の生成（カスタム名またはタイムスタンプ付き）
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || getFileExtFromMimeType(file.type);
    const fileName = customFileName || `file-${timestamp}.${fileExt}`;
    
    // Supabaseストレージにアップロード
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true
      });
      
    if (error) {
      throw error;
    }
    
    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);
      
    if (!urlData || !urlData.publicUrl) {
      return { url: null, error: new Error('公開URLの取得に失敗しました') };
    }
    
    // URLパスの検証と修正
    let publicUrl = urlData.publicUrl;
    
    // URLパスに「/public/」が含まれているか確認
    if (!publicUrl.includes('/object/public/')) {
      
      // 不足している「/public/」を挿入
      publicUrl = publicUrl.replace('/object/', '/object/public/');
    }
    
    
    // URLが実際に有効かチェック（オプション）
    try {
      const imageTest = new Image();
      imageTest.src = publicUrl;
      
      // 画像のロードを待つ
      await new Promise((resolve, reject) => {
        imageTest.onload = resolve;
        imageTest.onerror = reject;
        // 10秒のタイムアウト
        setTimeout(() => reject(new Error('画像URLの検証がタイムアウトしました')), 10000);
      });
      
    } catch (imageError) {
      // 検証に失敗しても続行する
    }
    
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return { 
      url: null, 
      error: error instanceof Error ? error : new Error('ファイルアップロード中にエラーが発生しました') 
    };
  }
}

/**
 * ファイルサイズをチェック
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * ファイルタイプをチェック
 */
export function isValidFileType(file: File, allowedTypes: string[] = ['image/']): boolean {
  // 完全一致または前方一致のいずれかをチェック
  return allowedTypes.some(type => 
    type.endsWith('/') 
      ? file.type.startsWith(type) // 'image/' のような前方一致
      : file.type === type         // 'image/png' のような完全一致
  );
}

/**
 * データURLをFileオブジェクトに変換する関数
 * @param dataurl データURL
 * @param filename ファイル名
 * @returns 変換されたFileオブジェクト
 */
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  try {
    // データURLの形式を確認
    if (!dataurl.startsWith('data:')) {
      console.error('無効なデータURL形式');
      throw new Error('無効なデータURL形式');
    }
    
    // データURLをヘッダーとデータ部分に分割
    const parts = dataurl.split(';base64,');
    if (parts.length !== 2) {
      console.error('無効なBase64データURL形式');
      throw new Error('無効なBase64データURL形式');
    }
    
    // MIMEタイプを抽出し、画像形式かチェック
    let mimeType = parts[0].replace('data:', '');
    
    // サポートする画像形式の定義
    const supportedImageTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
    ];
    
    // MIMEタイプが画像でない場合は強制的に画像形式に変更
    if (!mimeType.startsWith('image/')) {
      mimeType = 'image/png';
    } else if (!supportedImageTypes.includes(mimeType)) {
      mimeType = 'image/png'; // サポートされていない画像形式の場合もpngをデフォルトに
    }
    
    
    try {
      // Base64デコード
      const byteString = atob(parts[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // バイト配列に変換
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      
      // ファイル拡張子の検出
      const fileExt = mimeType.split('/')[1] || 'png';
      
      // 拡張子が含まれていない場合はファイル名に追加
      let finalFilename = filename;
      if (!filename.includes('.')) {
        finalFilename = `${filename}.${fileExt}`;
      }
      
      // Blobを作成し、そこからFileを生成
      // contentTypeを必ず画像形式にする
      const blob = new Blob([uint8Array], { type: mimeType });
      const file = new File([blob], finalFilename, { type: mimeType });
      
      
      return file;
    } catch (e) {
      console.error('Base64デコードエラー:', e);
      throw new Error('Base64デコードに失敗しました');
    }
  } catch (error) {
    console.error('dataURLtoFile 変換エラー:', error);
    // エラー時はダミーの空画像を返す
    const emptyBlob = new Blob([], { type: 'image/png' });
    return new File([emptyBlob], filename, { type: 'image/png' });
  }
};

/**
 * ストレージにサムネイル画像をアップロードする関数
 * @param file アップロードするファイル
 * @returns 公開URL
 */
export const uploadThumbnailToStorage = async (file: File): Promise<string | null> => {
  if (!file) {
    console.error('サムネイルアップロード: ファイルがnullです');
    return null;
  }
  
  try {
    
    // 認証トークンを取得（認証済みユーザーの場合）
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    // FormDataを作成
    const formData = new FormData();
    formData.append('thumbnailImage', file);
    
    // API経由でアップロード（アバターと同じサーバーサイド処理を使用）
    const response = await fetch('/api/thumbnail/upload', {
      method: 'POST',
      headers: {
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('サムネイルアップロードAPI応答エラー:', response.status, errorText);
      throw new Error(`アップロードに失敗しました: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.publicUrl) {
      console.error('公開URL取得エラー:', result);
      throw new Error('公開URLの取得に失敗しました');
    }
    
    return result.publicUrl;
  } catch (error) {
    console.error('サムネイルアップロードエラー:', error);
    toast({
      title: "サムネイルエラー",
      description: "画像のアップロードに失敗しました。",
      variant: "destructive",
    });
    return null;
  }
}; 
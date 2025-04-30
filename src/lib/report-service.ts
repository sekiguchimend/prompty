/**
 * 報告の対象タイプ
 */
export type ReportTargetType = 
  | 'comment' // コメント
  | 'prompt';  // プロンプト（コンテンツ）

/**
 * 報告の理由タイプ
 */
export type ReportReason = 
  | 'inappropriate' // 不適切なコンテンツ
  | 'spam' // スパム
  | 'harassment' // 嫌がらせ/ハラスメント
  | 'misinformation' // 誤情報/虚偽情報
  | 'other'; // その他

/**
 * 報告の詳細データ
 */
export interface ReportData {
  target_type: ReportTargetType;
  target_id: string;  // コメントIDまたはプロンプトID
  prompt_id: string;  // 関連するプロンプトID
  reporter_id: string;
  reason: ReportReason;
  details?: string;
}

// グローバルトースト用のイベント名
const GLOBAL_TOAST_EVENT = 'global:toast:show';

// グローバルトースト表示関数
export const showGlobalToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  // カスタムイベントを発行
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(GLOBAL_TOAST_EVENT, {
      detail: { title, description, variant }
    });
    window.dispatchEvent(event);
  }
};

/**
 * 認証トークンを取得する関数
 * Supabaseのセッションからトークンを取得
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // ローカルストレージからSupabaseセッションを取得
    const supabaseSession = localStorage.getItem('supabase.auth.token');
    if (supabaseSession) {
      const session = JSON.parse(supabaseSession);
      const accessToken = session?.access_token || session?.data?.access_token;
      return accessToken || null;
    }
    
    // もし上記の方法で取得できない場合はクッキーから取得（代替手段）
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'supabase-auth-token') {
        return value;
      }
    }
    
    return null;
  } catch (error) {
    console.error('認証トークン取得エラー:', error);
    return null;
  }
};

/**
 * コンテンツまたはコメントを報告する関数
 * @param reportData 報告データ
 * @returns 報告の成功/失敗結果
 */
export const submitReport = async (reportData: ReportData): Promise<{ success: boolean, message: string, data?: any }> => {
  try {
    // 対象タイプに応じてエンドポイントを選択
    const endpoint = reportData.target_type === 'comment' 
      ? '/api/comments/report' 
      : '/api/prompts/report';
    
    // 認証トークンの取得
    const authToken = getAuthToken();
    console.log('認証トークン状態:', { 
      hasToken: !!authToken, 
      tokenLength: authToken?.length || 0,
      tokenPreview: authToken ? `${authToken.substring(0, 15)}...` : 'なし'
    });
    
    // リクエストヘッダーの設定
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // 認証トークンがあれば追加
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // APIへのリクエスト
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportData),
    });

    // レスポンスがJSONでない場合のエラーハンドリング
    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('レスポンスの解析に失敗:', e);
      throw new Error(`サーバーからの応答を解析できませんでした: ${response.status} ${response.statusText}`);
    }

    // レスポンスステータスが成功でない場合はエラーとする
    if (!response.ok) {
      // サーバーからのエラー情報を表示
      const errorMessage = result.message || result.error || '報告の送信に失敗しました';
      console.error('サーバーからのエラー:', result);
      throw new Error(errorMessage);
    }

    // 成功メッセージを表示
    const targetName = reportData.target_type === 'comment' ? 'コメント' : 'コンテンツ';
    showGlobalToast(
      '報告を受け付けました', 
      `${targetName}を報告しました。ご協力ありがとうございます。`
    );
    return result;
  } catch (error) {
    console.error('報告中にエラーが発生:', error);
    let errorMessage = '不明なエラー';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // エラーメッセージを表示
    showGlobalToast('エラー', errorMessage, 'destructive');
    
    return {
      success: false,
      message: errorMessage
    };
  }
}; 
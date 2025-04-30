/**
 * コメント報告の理由タイプ
 */
export type ReportReason = 
  | 'inappropriate' // 不適切なコンテンツ
  | 'spam' // スパム
  | 'harassment' // 嫌がらせ/ハラスメント
  | 'misinformation' // 誤情報/虚偽情報
  | 'other'; // その他

/**
 * コメント報告のインターフェース
 */
export interface CommentReport {
  comment_id: string;
  prompt_id: string;
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
 * コメントを報告する関数
 * @param reportData 報告データ
 * @returns 報告の成功/失敗結果
 */
export const reportComment = async (reportData: CommentReport): Promise<{ success: boolean, message: string, data?: any }> => {
  try {
    const response = await fetch('/api/comments/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '報告の送信に失敗しました');
    }

    // 成功メッセージを表示
    showGlobalToast('報告を受け付けました', 'コメントを報告しました。ご協力ありがとうございます。');
    return result;
  } catch (error) {
    console.error('コメント報告中にエラーが発生:', error);
    const errorMessage = error instanceof Error ? error.message : 'コメント報告中に不明なエラーが発生しました';
    
    // エラーメッセージを表示
    showGlobalToast('エラー', errorMessage, 'destructive');
    
    return {
      success: false,
      message: errorMessage
    };
  }
}; 
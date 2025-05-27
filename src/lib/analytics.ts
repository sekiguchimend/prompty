import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// ユニークユーザーIDを取得または生成（シンプル化）
export const getVisitorId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// トラック済みの記事IDを保持するセットを追加 (メモリ内キャッシュ)
const trackedPromptIds = new Set<string>();

// 非常にシンプル化したビュートラッキング
export const trackView = async (promptId: string): Promise<boolean> => {
  if (!promptId || typeof window === 'undefined') return false;
  
  // 既にこのセッションでトラックしていたら処理しない（メモリ内チェック）
  if (trackedPromptIds.has(promptId)) {
    return true;
  }
  
  try {
    // シンプルなユーザー識別子を取得
    const visitorId = getVisitorId();
    
    // カラム名の不整合に対応：visitor_idまたはuser_idを試行
    const success = await tryTrackWithColumns(promptId, visitorId);
    
    if (success) {
      trackedPromptIds.add(promptId);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('ビュートラッキング中にエラーが発生しました:', err);
    return false;
  }
};

// カラム名を試行する関数
const tryTrackWithColumns = async (promptId: string, visitorId: string): Promise<boolean> => {
  // 最初に visitor_id で試行（最新のスキーマ）
  const visitorIdSuccess = await tryUpsertWithColumn(promptId, visitorId, 'visitor_id');
  if (visitorIdSuccess) {
    return true;
  }
  
  // visitor_idが失敗した場合、user_id で試行（古いスキーマ）
  const userIdSuccess = await tryUpsertWithColumn(promptId, visitorId, 'user_id');
  if (userIdSuccess) {
    return true;
  }
  
  // 両方とも失敗した場合はフォールバック処理を試行
  return await handleFallbackTracking(promptId, visitorId);
};

// 指定されたカラム名でupsertを試行する関数
const tryUpsertWithColumn = async (promptId: string, visitorId: string, columnName: 'visitor_id' | 'user_id'): Promise<boolean> => {
  try {
    const insertData = {
      prompt_id: promptId,
      [columnName]: visitorId
    };
    
    const conflictColumns = `prompt_id,${columnName}`;
    
    const { error: upsertError } = await supabase
      .from('analytics_views')
      .upsert(insertData, {
        onConflict: conflictColumns
      });
    
    if (upsertError) {
      // テーブルが存在しない場合
      if (upsertError.code === '42P01' || upsertError.message?.includes('does not exist')) {
        return true; // スキップとして成功扱い
      }
      
      // カラムが存在しない場合
      if (upsertError.code === '42703' || upsertError.message?.includes('column') || upsertError.message?.includes('does not exist')) {
        return false; // 他のカラム名を試行
      }
      
      // 409エラーの場合は成功として扱う
      if (upsertError.message?.includes('409') || upsertError.message?.includes('conflict')) {
        return true;
      }
      
      console.error(`${columnName}での閲覧記録エラー:`, upsertError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`${columnName}でのupsert処理中のエラー:`, err);
    return false;
  }
};

// フォールバック処理：従来のselect + insertパターン（両方のカラム名を試行）
const handleFallbackTracking = async (promptId: string, visitorId: string): Promise<boolean> => {
  // visitor_idでフォールバック処理を試行
  const visitorIdSuccess = await tryFallbackWithColumn(promptId, visitorId, 'visitor_id');
  if (visitorIdSuccess) {
    return true;
  }
  
  // user_idでフォールバック処理を試行
  const userIdSuccess = await tryFallbackWithColumn(promptId, visitorId, 'user_id');
  return userIdSuccess;
};

// 指定されたカラム名でフォールバック処理を試行する関数
const tryFallbackWithColumn = async (promptId: string, visitorId: string, columnName: 'visitor_id' | 'user_id'): Promise<boolean> => {
  try {
    // 既存のビューを確認
    const { data, error: selectError } = await supabase
      .from('analytics_views')
      .select('id')
      .eq('prompt_id', promptId)
      .eq(columnName, visitorId)
      .maybeSingle();
    
    if (selectError) {
      // カラムが存在しない場合
      if (selectError.code === '42703' || selectError.message?.includes('column') || selectError.message?.includes('does not exist')) {
        return false;
      }
      
      console.error(`フォールバック(${columnName}) - ビュー確認エラー:`, selectError);
      return false;
    }
    
    // 既に記録がある場合は終了
    if (data) {
      return true;
    }
    
    // 新しい閲覧記録を作成
    const insertData = {
      prompt_id: promptId,
      [columnName]: visitorId
    };
    
    const { error: insertError } = await supabase
      .from('analytics_views')
      .insert(insertData);
    
    if (insertError) {
      // 重複キーエラーの場合は成功として扱う
      if (insertError.code === '23505') {
        return true;
      }
      
      // カラムが存在しない場合
      if (insertError.code === '42703') {
        return false;
      }
      
      console.error(`フォールバック(${columnName}) - 閲覧記録エラー:`, insertError);
      return false;
    }
    
    return true;
    
  } catch (err) {
    console.error(`フォールバック(${columnName})処理中のエラー:`, err);
    return false;
  }
};

// 記事の閲覧数を取得
export const getViewCount = async (promptId: string): Promise<number> => {
  if (!promptId) return 0;
  
  try {

    
    // 1. まずprompts テーブルから view_count を取得
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('view_count')
      .eq('id', promptId)
      .single();
    
    // view_countが取得できた場合
    if (!promptError && promptData) {

      
      // anyにキャストして型エラーを回避
      const promptDataAny = promptData as any;
      // 数値に変換して型安全性を確保
      const promptViewCount = Number(promptDataAny.view_count || 0);
      
      // 2. analytics_views テーブルからカウントを取得（カラム名の違いに対応）
      const analyticsCount = await getAnalyticsViewCount(promptId);
      
      if (analyticsCount >= 0) {
        // 3. 両方のカウントを比較して大きい方を採用
        const finalCount = Math.max(promptViewCount, analyticsCount);
        return finalCount;
      }
      
      // analytics_viewsの取得が失敗した場合はpromptsテーブルの値を使用
      return promptViewCount;
    }
    
    // prompts テーブルからの取得に失敗した場合は analytics_views を使用
    const analyticsCount = await getAnalyticsViewCount(promptId);
    
    if (analyticsCount >= 0) {
      return analyticsCount;
    }
    
    console.error('両方のテーブルからのビュー数取得に失敗');
    return 0;
  } catch (err) {
    console.error('閲覧数取得中にエラーが発生しました:', err);
    return 0;
  }
};

// analytics_viewsテーブルからビュー数を取得（カラム名の違いに対応）
const getAnalyticsViewCount = async (promptId: string): Promise<number> => {
  // どのカラム名が使われているかテストして適切な方を使用
  
  // 最初にvisitor_idカラムで試行
  try {
    const { count, error } = await supabase
      .from('analytics_views')
      .select('id', { count: 'exact', head: true })
      .eq('prompt_id', promptId);
    
    if (!error) {
      return Number(count || 0);
    }
    
    // テーブルが存在しない場合
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return -1; // エラーを示すマーカー
    }
  } catch (err) {
    // エラーの場合は次のスキーマを試行
  }
  
  // user_idカラムで試行（古いスキーマ対応）
  try {
    // user_idの存在確認のため、まず1件取得を試行
    const { data: testData, error: testError } = await supabase
      .from('analytics_views')
      .select('user_id')
      .limit(1)
      .single();
    
    // user_idカラムが存在する場合のカウント取得
    if (!testError || testError.code !== '42703') {
      const { count, error: countError } = await supabase
        .from('analytics_views')
        .select('id', { count: 'exact', head: true })
        .eq('prompt_id', promptId);
      
      if (!countError) {
        return Number(count || 0);
      }
      
      console.error('user_idスキーマでカウント取得エラー:', countError);
      return -1;
    }
    
    return -1;
  } catch (err) {
    console.error('user_idスキーマでエラー:', err);
    return -1;
  }
}; 
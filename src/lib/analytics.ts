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
    console.log('このセッションで既にトラッキング済み:', promptId);
    return true;
  }
  
  try {
    // シンプルなユーザー識別子を取得
    const visitorId = getVisitorId();
    
    // 既存のビューを確認
    const { data, error: selectError } = await supabase
      .from('analytics_views')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', visitorId)
      .maybeSingle();
    
    if (selectError) {
      console.error('ビュー確認エラー:', selectError);
      return false;
    }
    
    // 既に記録がある場合は終了（view_countは更新しない）
    if (data) {
      console.log('すでに閲覧済み - カウント更新なし');
      // セットに追加してこのセッションでは再度処理しないようにする
      trackedPromptIds.add(promptId);
      return true; // 既に閲覧記録があるため成功として扱う
    }
    
    // 新しい閲覧記録を作成
    try {
      // 1. analytics_viewsテーブルに記録を試みる
      const { error: insertError } = await supabase
        .from('analytics_views')
        .insert({
          prompt_id: promptId,
          user_id: visitorId
        });
      
      if (insertError) {
        // 重複キーエラー（409 Conflict）の場合は処理を終了
        if (insertError.code === '23505') {
          console.log('既に閲覧済みです（重複エラー） - view_count更新はスキップ');
          // セットに追加してこのセッションでは再度処理しないようにする
          trackedPromptIds.add(promptId);
          return true;
        }
        
        console.error('閲覧記録エラー:', insertError);
        return false;
      }
      
      console.log('新しい閲覧を記録しました。view_countを更新します...');
      
      // 処理が完了したらセットに追加してこのセッションでは再度処理しないようにする
      trackedPromptIds.add(promptId);
      
      // 以下はデータベースのトリガーで自動処理されるため、クライアント側での更新は不要
      // しかし、トリガーがない場合に備えて残しておく
      try {
        // view_countを直接+1する - インクリメント関数を使用
        const { error: updateError } = await supabase
          .from('prompts')
          .update({ view_count: supabase.rpc('increment', { count: 1 }) })
          .eq('id', promptId);
          
        if (!updateError) {
          console.log('view_countをインクリメント関数で更新しました');
          return true;
        }
        
        // インクリメント関数が使えない場合、現在値を取得して+1
        const { data: currentPrompt, error: getError } = await supabase
          .from('prompts')
          .select('view_count')
          .eq('id', promptId)
          .single();
        
        if (!getError && currentPrompt) {
          // view_countをanyにキャストして型エラーを回避
          const currentPromptAny = currentPrompt as any;
          // 数値に変換。値がnullまたはundefinedの場合は0をデフォルト値として使用
          const currentCount = Number(currentPromptAny.view_count || 0);
          const newCount = currentCount + 1;
          
          const { error: directUpdateError } = await supabase
            .from('prompts')
            .update({ view_count: newCount })
            .eq('id', promptId);
          
          if (!directUpdateError) {
            console.log(`view_countを${currentCount}から${newCount}に更新しました`);
          } else {
            console.error('view_count直接更新エラー:', directUpdateError);
          }
        }
      } catch (updateErr) {
        console.error('view_count更新中のエラー:', updateErr);
      }
      
      return true;
    } catch (err) {
      console.error('閲覧記録処理中のエラー:', err);
      return false;
    }
  } catch (err) {
    console.error('ビュートラッキング中にエラーが発生しました:', err);
    return false;
  }
};

// 記事の閲覧数を取得
export const getViewCount = async (promptId: string): Promise<number> => {
  if (!promptId) return 0;
  
  try {
    console.log('ビュー数取得開始 - プロンプトID:', promptId);
    
    // 1. まずprompts テーブルから view_count を取得
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('view_count')
      .eq('id', promptId)
      .single();
    
    // view_countが取得できた場合
    if (!promptError && promptData) {
      // デバッグ用
      console.log('fetchしたpromptData:', promptData);
      
      // anyにキャストして型エラーを回避
      const promptDataAny = promptData as any;
      // 数値に変換して型安全性を確保
      const promptViewCount = Number(promptDataAny.view_count || 0);
      console.log('promptsテーブルからのビュー数:', promptViewCount);
      
      // 2. analytics_views テーブルからカウントを取得
      const { count: analyticsCount, error: analyticsError } = await supabase
        .from('analytics_views')
        .select('id', { count: 'exact', head: true })
        .eq('prompt_id', promptId);
      
      if (!analyticsError) {
        const analyticsCountNumber = Number(analyticsCount || 0);
        console.log('analytics_viewsテーブルからのビュー数:', analyticsCountNumber);
        
        // 3. 両方のカウントを比較して大きい方を採用
        const finalCount = Math.max(promptViewCount, analyticsCountNumber);
        console.log('採用するビュー数:', finalCount);
        return finalCount;
      }
      
      // analytics_viewsの取得に失敗した場合はpromptのカウントを使用
      return promptViewCount;
    }
    
    // prompts テーブルからの取得に失敗した場合は analytics_views を使用
    console.log('promptsテーブルからの取得に失敗、analytics_viewsを使用します');
    const { count: analyticsCount, error: analyticsError } = await supabase
      .from('analytics_views')
      .select('id', { count: 'exact', head: true })
      .eq('prompt_id', promptId);
    
    if (analyticsError) {
      console.error('analytics_viewsからのビュー数取得エラー:', analyticsError);
      return 0;
    }
    
    console.log('analytics_viewsからのビュー数:', analyticsCount || 0);
    return analyticsCount || 0;
  } catch (err) {
    console.error('閲覧数取得中にエラーが発生しました:', err);
    return 0;
  }
}; 
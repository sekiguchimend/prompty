import { supabase } from './supabase-unified';

// シンプルなビュートラッキング - 確実にカウント
export const trackView = async (promptId: string): Promise<boolean> => {
  console.log('🔍 trackView called with promptId:', promptId);
  
  if (!promptId || typeof window === 'undefined') {
    console.log('❌ trackView: Invalid promptId or not in browser');
    return false;
  }
  
  try {
    console.log('📊 Incrementing view_count for prompt:', promptId);
    
    // RPC関数を使用してアトミックにインクリメント
    const { data, error } = await supabase.rpc('increment_view_count', {
      prompt_id: promptId
    });
    
    if (error) {
      console.error('❌ RPC関数エラー、フォールバック処理を実行:', error);
      
      // フォールバック: 従来の方法
      const { data: currentData, error: selectError } = await supabase
        .from('prompts')
        .select('view_count')
        .eq('id', promptId)
        .single();
      
      if (selectError) {
        console.error('❌ フォールバック: ビューカウント取得エラー:', selectError);
        return false;
      }
      
      const currentCount = currentData?.view_count || 0;
      const newCount = currentCount + 1;
      
      console.log(`📈 フォールバック: Updating view_count: ${currentCount} → ${newCount}`);
      
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ view_count: newCount })
        .eq('id', promptId);
      
      if (updateError) {
        console.error('❌ フォールバック: ビュートラッキングエラー:', updateError);
        return false;
      }
      
      console.log('✅ フォールバック: View count successfully updated to:', newCount);
      return true;
    }
    
    console.log('✅ RPC関数でView count successfully updated:', data);
    return true;
  } catch (err) {
    console.error('❌ ビュートラッキング中にエラーが発生しました:', err);
    return false;
  }
};


// 記事の閲覧数を取得
export const getViewCount = async (promptId: string): Promise<number> => {
  console.log('📊 getViewCount called with promptId:', promptId);
  
  if (!promptId) {
    console.log('❌ getViewCount: Invalid promptId');
    return 0;
  }
  
  try {
    // prompts テーブルから view_count を直接取得
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('view_count')
      .eq('id', promptId)
      .single();
    
    if (promptError) {
      console.error('❌ getViewCount: Database error:', promptError);
      return 0;
    }
    
    if (!promptData) {
      console.log('❌ getViewCount: No data found for promptId:', promptId);
      return 0;
    }
    
    const count = Number(promptData.view_count || 0);
    console.log('✅ getViewCount: Retrieved count:', count, 'for prompt:', promptId);
    
    return count;
  } catch (err) {
    console.error('❌ 閲覧数取得中にエラーが発生しました:', err);
    return 0;
  }
}; 
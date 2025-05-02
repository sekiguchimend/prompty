import { supabase } from './supabaseClient';

// 型定義
interface PromptData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
  author_id: string;
  profiles?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ViewedPromptData {
  prompt_id: string;
  viewed_at: string;
  prompts: PromptData;
}

// 閲覧履歴を保存する関数
export const recordPromptView = async (promptId: string) => {
  try {
    // ログイン中のユーザー情報を取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('未ログイン状態では閲覧履歴を保存しません');
      return { success: false, error: new Error('未ログインユーザー') };
    }

    const userId = session.user.id;

    // 既存の閲覧履歴があるか確認
    const { data: existingView } = await supabase
      .from('recently_viewed_prompts')
      .select('id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .single();

    if (existingView) {
      // 既存の履歴がある場合は日時を更新
      const { error } = await supabase
        .from('recently_viewed_prompts')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', existingView.id);

      if (error) throw error;
      
      return { success: true };
    } else {
      // 既存の履歴がない場合は新規作成
      const { error } = await supabase
        .from('recently_viewed_prompts')
        .insert({
          user_id: userId,
          prompt_id: promptId,
          viewed_at: new Date().toISOString()
        });

      if (error) throw error;
      
      return { success: true };
    }
  } catch (error: any) {
    console.error('閲覧履歴保存エラー:', error.message);
    return { success: false, error };
  }
};

// 閲覧履歴を取得する関数
export const getRecentlyViewedPrompts = async (limit: number = 5) => {
  try {
    // ログイン中のユーザー情報を取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('未ログイン状態では閲覧履歴を取得できません');
      return { success: false, data: [], error: new Error('未ログインユーザー') };
    }

    const userId = session.user.id;

    // 閲覧履歴を取得（最新順）
    const { data, error } = await supabase
      .from('recently_viewed_prompts')
      .select(`
        prompt_id,
        viewed_at,
        prompts (
          id,
          title,
          thumbnail_url,
          created_at,
          author_id,
          profiles:profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // データを整形
    const formattedData = data.map((item: any) => ({
      id: item.prompts.id,
      title: item.prompts.title,
      thumbnailUrl: item.prompts.thumbnail_url,
      postedAt: new Date(item.prompts.created_at).toLocaleDateString('ja-JP'),
      viewedAt: new Date(item.viewed_at).toLocaleDateString('ja-JP'),
      likeCount: 0, // この情報は別途取得が必要
      user: {
        name: item.prompts.profiles?.display_name || '匿名',
        account_name: item.prompts.profiles?.username,
        avatarUrl: item.prompts.profiles?.avatar_url || '/images/default-avatar.png'
      }
    }));

    return { success: true, data: formattedData };
  } catch (error: any) {
    console.error('閲覧履歴取得エラー:', error.message);
    return { success: false, data: [], error };
  }
}; 
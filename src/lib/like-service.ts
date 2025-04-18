import { supabase } from './supabaseClient';

/**
 * 投稿に「いいね」する
 * @param promptId いいねするプロンプトのID
 * @param userId いいねするユーザーのID
 * @returns 処理結果
 */
export const likePrompt = async (promptId: string, userId: string) => {
  try {
    // すでにいいねしているか確認
    const { data: existingLike, error: existingError } = await supabase
      .from('likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // 結果がない場合のエラーは無視
      throw existingError;
    }

    if (existingLike) {
      // すでにいいねしている場合は何もしない
      return { success: true, alreadyLiked: true };
    }

    // いいねをデータベースに追加
    const { error } = await supabase
      .from('likes')
      .insert({ prompt_id: promptId, user_id: userId });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('いいね追加エラー:', error);
    return { success: false, error };
  }
};

/**
 * 投稿の「いいね」を取り消す
 * @param promptId いいねを取り消すプロンプトのID
 * @param userId ユーザーのID
 * @returns 処理結果
 */
export const unlikePrompt = async (promptId: string, userId: string) => {
  try {
    // いいねを削除
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('prompt_id', promptId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('いいね取り消しエラー:', error);
    return { success: false, error };
  }
};

/**
 * ユーザーが投稿にいいねしているか確認
 * @param promptId プロンプトID
 * @param userId ユーザーID
 * @returns いいねしているかどうか
 */
export const checkIfLiked = async (promptId: string, userId: string) => {
  try {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .match({ prompt_id: promptId, user_id: userId })
      .single();

    if (error && error.code !== 'PGRST116') { // 結果がない場合のエラーは無視
      console.error('いいね確認エラー:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('いいね確認中にエラーが発生:', error);
    return false;
  }
};

/**
 * プロンプトのいいね数を取得
 * @param promptId プロンプトID
 * @returns いいね数
 */
export const getLikeCount = async (promptId: string) => {
  try {
    const { count, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('prompt_id', promptId);

    if (error) {
      console.error('いいね数取得エラー:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('いいね数取得中にエラーが発生:', error);
    return 0;
  }
}; 
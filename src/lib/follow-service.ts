import { supabase } from './supabaseClient';

/**
 * 指定したユーザーをフォローする
 * @param followingId フォロー対象のユーザーID
 * @param followerId フォローする側のユーザーID（ログインユーザー）
 */
export const followUser = async (followingId: string, followerId: string) => {
  try {
    // 既にフォローしているかチェック
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116はデータが見つからないエラー
      console.error('フォロー状態確認エラー:', checkError);
      return { success: false, error: checkError };
    }
    
    // 既にフォローしている場合は成功として返す
    if (existingFollow) {
      return { success: true, data: existingFollow, isFollowing: true };
    }
    
    // フォローを追加
    const { data, error } = await supabase
      .from('follows')
      .insert([
        { follower_id: followerId, following_id: followingId }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('フォロー追加エラー:', error);
      return { success: false, error };
    }
    
    console.log('フォロー成功:', data);
    return { success: true, data, isFollowing: true };
  } catch (error) {
    console.error('フォロー処理エラー:', error);
    return { success: false, error };
  }
};

/**
 * 指定したユーザーのフォローを解除する
 * @param followingId フォロー解除する対象のユーザーID
 * @param followerId フォロー解除する側のユーザーID（ログインユーザー）
 */
export const unfollowUser = async (followingId: string, followerId: string) => {
  try {
    // フォローを削除
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
      
    if (error) {
      console.error('フォロー解除エラー:', error);
      return { success: false, error };
    }
    
    console.log('フォロー解除成功');
    return { success: true, isFollowing: false };
  } catch (error) {
    console.error('フォロー解除処理エラー:', error);
    return { success: false, error };
  }
};

/**
 * 現在のユーザーが指定されたユーザーをフォローしているかチェックする
 * @param followingId チェック対象のユーザーID
 * @param followerId チェックする側のユーザーID（ログインユーザー）
 */
export const checkIfFollowing = async (followingId: string, followerId: string) => {
  try {
    // ユーザーIDが無い場合は未フォロー状態を返す
    if (!followerId || !followingId) {
      return false;
    }
    
    // フォロー状態をチェック
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116はデータが見つからないエラー
      console.error('フォロー状態確認エラー:', error);
      return false;
    }
    
    // データが見つかればフォローしている
    return !!data;
  } catch (error) {
    console.error('フォロー状態確認処理エラー:', error);
    return false;
  }
}; 
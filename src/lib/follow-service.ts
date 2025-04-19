import { supabase } from './supabaseClient';

/**
 * 指定したユーザーをフォローする
 * @param followingId フォロー対象のユーザーID
 * @param followerId フォローする側のユーザーID（ログインユーザー）
 */
export const followUser = async (followingId: string, followerId: string) => {
  console.log('フォロー処理開始:', { followingId, followerId });
  
  // バリデーション
  if (!followingId || !followerId) {
    console.error('フォローエラー: ユーザーIDが無効です', { followingId, followerId });
    return { 
      success: false, 
      error: new Error('ユーザーIDが指定されていません'),
      isFollowing: false
    };
  }

  // 自分自身をフォローしようとしている場合
  if (followingId === followerId) {
    console.warn('自分自身をフォローすることはできません');
    return { 
      success: false, 
      error: new Error('自分自身をフォローすることはできません'),
      isFollowing: false 
    };
  }

  try {
    // 既にフォローしているかチェック
    console.log('フォロー状態チェック中...');
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116はデータが見つからないエラー
      console.error('フォロー状態確認エラー:', checkError);
      return { success: false, error: checkError, isFollowing: false };
    }
    
    // 既にフォローしている場合は成功として返す
    if (existingFollow) {
      console.log('既にフォロー済みです:', existingFollow);
      return { success: true, data: existingFollow, isFollowing: true };
    }
    
    // フォローを追加
    console.log('followsテーブルにデータを追加します...');
    
    const insertData = { 
      follower_id: followerId, 
      following_id: followingId,
      created_at: new Date().toISOString() 
    };
    
    console.log('挿入するデータ:', insertData);
    
    const { data, error } = await supabase
      .from('follows')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('フォロー追加エラー:', error);
      return { success: false, error, isFollowing: false };
    }
    
    console.log('フォロー成功 - followsテーブルに保存完了:', data);
    return { success: true, data, isFollowing: true };
  } catch (error) {
    console.error('フォロー処理エラー:', error);
    return { success: false, error, isFollowing: false };
  }
};

/**
 * 指定したユーザーのフォローを解除する
 * @param followingId フォロー解除する対象のユーザーID
 * @param followerId フォロー解除する側のユーザーID（ログインユーザー）
 */
export const unfollowUser = async (followingId: string, followerId: string) => {
  console.log('フォロー解除処理開始:', { followingId, followerId });
  
  // バリデーション
  if (!followingId || !followerId) {
    console.error('フォロー解除エラー: ユーザーIDが無効です', { followingId, followerId });
    return { 
      success: false, 
      error: new Error('ユーザーIDが指定されていません'),
      isFollowing: true
    };
  }

  try {
    // フォローレコードの存在確認
    console.log('フォローレコードの存在確認...');
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('フォローレコード確認エラー:', checkError);
    } else if (!existingFollow) {
      console.log('削除するフォローレコードが見つかりません（既に解除済み）');
      return { success: true, isFollowing: false };
    } else {
      console.log('削除するフォローレコード:', existingFollow);
    }
    
    // フォローを削除
    console.log('followsテーブルからデータを削除します...');
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
      
    if (error) {
      console.error('フォロー解除エラー:', error);
      return { success: false, error, isFollowing: true };
    }
    
    console.log('フォロー解除成功 - followsテーブルから削除完了');
    return { success: true, isFollowing: false };
  } catch (error) {
    console.error('フォロー解除処理エラー:', error);
    return { success: false, error, isFollowing: true };
  }
};

/**
 * 現在のユーザーが指定されたユーザーをフォローしているかチェックする
 * @param followingId チェック対象のユーザーID
 * @param followerId チェックする側のユーザーID（ログインユーザー）
 * @returns フォロー状態 (true: フォロー中、false: フォローしていない)
 */
export const checkIfFollowing = async (followingId: string, followerId: string) => {
  console.log('フォロー状態確認開始:', { followingId, followerId });
  
  try {
    // ユーザーIDが無い場合は未フォロー状態を返す
    if (!followerId || !followingId) {
      console.log('フォロー状態確認: ユーザーIDが指定されていないため、未フォロー状態として返します', { followingId, followerId });
      return false;
    }

    // 自分自身に対するチェックの場合
    if (followingId === followerId) {
      console.log('フォロー状態確認: 自分自身のため、未フォロー状態として返します');
      return false;
    }
    
    // フォロー状態をチェック
    console.log('followsテーブルをクエリします...');
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
    const isFollowing = !!data;
    console.log('フォロー状態確認結果:', isFollowing ? 'フォロー中' : '未フォロー', data);
    
    return isFollowing;
  } catch (error) {
    console.error('フォロー状態確認処理エラー:', error);
    return false;
  }
}; 
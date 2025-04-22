import { supabase } from './supabaseClient';

/**
 * 投稿をブックマークする
 * @param promptId ブックマークするプロンプトのID
 * @param userId ブックマークするユーザーのID
 * @returns 処理結果
 */
export const bookmarkPrompt = async (promptId: string, userId: string) => {
  try {
    // すでにブックマークしているか確認
    const isAlreadyBookmarked = await checkIfBookmarked(promptId, userId);
    
    if (isAlreadyBookmarked) {
      // すでにブックマークしている場合は何もしない
      return { success: true, alreadyBookmarked: true };
    }

    // MCPを使用してブックマークをデータベースに追加
    const response = await fetch('/api/bookmarks/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt_id: promptId, 
        user_id: userId 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ブックマーク追加に失敗しました');
    }
    
    return { success: true };
  } catch (error) {
    console.error('ブックマーク追加エラー:', error);
    return { success: false, error };
  }
};

/**
 * 投稿のブックマークを取り消す
 * @param promptId ブックマークを取り消すプロンプトのID
 * @param userId ユーザーのID
 * @returns 処理結果
 */
export const unbookmarkPrompt = async (promptId: string, userId: string) => {
  try {
    // MCPを使用してブックマークを削除
    const response = await fetch('/api/bookmarks/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt_id: promptId, 
        user_id: userId 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ブックマーク削除に失敗しました');
    }
    
    return { success: true };
  } catch (error) {
    console.error('ブックマーク取り消しエラー:', error);
    return { success: false, error };
  }
};

/**
 * ユーザーが投稿をブックマークしているか確認
 * @param promptId プロンプトID
 * @param userId ユーザーID
 * @returns ブックマークしているかどうか
 */
export const checkIfBookmarked = async (promptId: string, userId: string) => {
  try {
    if (!userId) return false;

    // Supabaseから直接データを取得する（API経由ではなく）
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId);

    if (error) {
      console.error('ブックマーク確認エラー:', error);
      return false;
    }

    return data && data.length > 0;

  } catch (error) {
    console.error('ブックマーク確認中にエラーが発生:', error);
    return false;
  }
};

/**
 * プロンプトのブックマーク数を取得
 * @param promptId プロンプトID
 * @returns ブックマーク数
 */
export const getBookmarkCount = async (promptId: string) => {
  try {
    // MCPを使用してブックマーク数を取得
    const response = await fetch(`/api/bookmarks/count?promptId=${promptId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ブックマーク数取得エラー:', response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('ブックマーク数取得中にエラーが発生:', error);
    return 0;
  }
};

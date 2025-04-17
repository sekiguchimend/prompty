import { supabase } from './supabaseClient';
import { PromptItem } from '../components/PromptGrid';

// データベースからフィーチャーされたプロンプトを取得
export async function getFeaturedPrompts(limit: number = 10): Promise<PromptItem[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      created_at,
      author_id,
      profiles(id, username, display_name, account_name, avatar_url)
    `)
    .eq('is_featured', true)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('フィーチャープロンプト取得エラー:', error);
    return [];
  }

  // いいね数を取得して結果に追加
  const promptsWithLikes = await addLikeCounts(data || []);
  return promptsWithLikes.map(item => transformToPromptItem(item));
}

// データベースからAI生成プロンプトを取得
export async function getAIGeneratedPrompts(limit: number = 10): Promise<PromptItem[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      created_at,
      author_id,
      profiles(id, username, display_name, account_name, avatar_url)
    `)
    .eq('is_ai_generated', true)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('AI生成プロンプト取得エラー:', error);
    return [];
  }

  // いいね数を取得して結果に追加
  const promptsWithLikes = await addLikeCounts(data || []);
  return promptsWithLikes.map(item => transformToPromptItem(item));
}

// データベースから人気プロンプトを取得
export async function getPopularPrompts(limit: number = 10): Promise<PromptItem[]> {
  // ビューを使用するか、RPC関数を使用して人気のプロンプトを取得
  // この例では簡単のために直接クエリを実行
  const { data, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      created_at,
      author_id,
      view_count,
      profiles(id, username, display_name, account_name, avatar_url)
    `)
    .eq('published', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('人気プロンプト取得エラー:', error);
    return [];
  }

  // いいね数を取得して結果に追加
  const promptsWithLikes = await addLikeCounts(data || []);
  return promptsWithLikes.map(item => transformToPromptItem(item));
}

// 各プロンプトのいいね数を取得して追加する関数
async function addLikeCounts(prompts: any[]): Promise<any[]> {
  if (!prompts || prompts.length === 0) return [];

  const promptIds = prompts.map(p => p.id);
  
  // プロンプトIDごとのいいね数を格納するオブジェクト
  const likeCounts: Record<string, number> = {};
  
  try {
    // いいねの数をカウントするクエリ
    const { data, error } = await supabase
      .from('likes')
      .select('prompt_id')
      .in('prompt_id', promptIds);
      
    if (error) {
      console.error('いいね数取得エラー:', error);
      return prompts;
    }
    
    // 各プロンプトIDごとのいいね数を集計
    if (data) {
      data.forEach(item => {
        const promptId = item.prompt_id;
        likeCounts[promptId] = (likeCounts[promptId] || 0) + 1;
      });
    }
    
    // 元のプロンプトデータにいいね数を追加
    return prompts.map(prompt => ({
      ...prompt,
      like_count: likeCounts[prompt.id] || 0
    }));
  } catch (err) {
    console.error('いいね数処理中のエラー:', err);
    return prompts;
  }
}

// 現在ログイン中のユーザーがいいねしているプロンプトを確認
export async function getUserLikedPrompts(userId: string | null): Promise<string[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('likes')
    .select('prompt_id')
    .eq('user_id', userId);

  if (error) {
    console.error('ユーザーのいいね取得エラー:', error);
    return [];
  }

  return data.map(item => item.prompt_id);
}

// Supabaseから取得したデータをPromptItem形式に変換
function transformToPromptItem(item: any): PromptItem {
  // 投稿日を相対時間に変換
  const postedAt = getRelativeTimeString(new Date(item.created_at));
  
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnail_url || 'https://via.placeholder.com/300x200', // デフォルト画像
    user: {
      name: item.profiles?.account_name || item.profiles?.display_name || item.profiles?.username || '不明なユーザー',
      avatarUrl: item.profiles?.avatar_url || 'https://via.placeholder.com/50x50',
    },
    postedAt,
    likeCount: item.like_count || 0,
    isLiked: false // この値はログインユーザーの状態に応じて別途設定する必要がある
  };
}

// 相対的な時間表示を計算する関数
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '数秒前';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}日前`;
  }
  
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}週間前`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前`;
} 
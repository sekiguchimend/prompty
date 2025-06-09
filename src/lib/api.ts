import { supabase } from './supabaseClient';
import { PromptItem } from '../components/prompt-grid';
import { DEFAULT_AVATAR_URL } from '../components/index';

// 最適化：複数のプロンプト種類をまとめて取得する関数
export async function getBatchPrompts(limit: number = 10): Promise<{
  featuredPrompts: PromptItem[],
  aiGeneratedPrompts: PromptItem[],
  popularPrompts: PromptItem[]
}> {
  try {
    // 1. フィーチャープロンプトの取得
    const { data: featuredData, error: featuredError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        author_id,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('is_featured', true)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (featuredError) {
      console.error('フィーチャープロンプト取得エラー:', featuredError);
      return { featuredPrompts: [], aiGeneratedPrompts: [], popularPrompts: [] };
    }

    // 2. AI生成プロンプトの取得
    const { data: aiGeneratedData, error: aiGeneratedError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        author_id,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('is_ai_generated', true)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (aiGeneratedError) {
      console.error('AI生成プロンプト取得エラー:', aiGeneratedError);
      return { 
        featuredPrompts: featuredData ? featuredData.map(item => transformToPromptItem(item)) : [], 
        aiGeneratedPrompts: [], 
        popularPrompts: [] 
      };
    }

    // 3. 人気プロンプトの取得
    const { data: popularData, error: popularError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        author_id,
        view_count,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (popularError) {
      console.error('人気プロンプト取得エラー:', popularError);
      return { 
        featuredPrompts: featuredData ? featuredData.map(item => transformToPromptItem(item)) : [], 
        aiGeneratedPrompts: aiGeneratedData ? aiGeneratedData.map(item => transformToPromptItem(item)) : [],
        popularPrompts: [] 
      };
    }

    // 4. すべてのプロンプトIDを結合してユニークにする
    const allPrompts = [
      ...(featuredData || []),
      ...(aiGeneratedData || []),
      ...(popularData || [])
    ];
    
    const uniquePromptIds = Array.from(new Set(allPrompts.map(p => p.id)));
    
    // 5. いいね数を一度に取得（1回のクエリで）
    const likeCounts: Record<string, number> = {};
    if (uniquePromptIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('prompt_id')
        .in('prompt_id', uniquePromptIds);
        
      if (!likesError && likesData) {
        likesData.forEach(item => {
          const promptId = item.prompt_id as string;
          likeCounts[promptId] = (likeCounts[promptId] || 0) + 1;
        });
      }
    }
    
    // 6. 各プロンプトセットにいいね数を追加して返す
    const processedFeaturedPrompts = featuredData 
      ? featuredData.map(item => transformToPromptItem({
          ...item, 
          like_count: likeCounts[item.id as string] || 0
        }))
      : [];
      
    const processedAiGeneratedPrompts = aiGeneratedData
      ? aiGeneratedData.map(item => transformToPromptItem({
          ...item, 
          like_count: likeCounts[item.id as string] || 0
        }))
      : [];
      
    const processedPopularPrompts = popularData
      ? popularData.map(item => transformToPromptItem({
          ...item, 
          like_count: likeCounts[item.id as string] || 0
        }))
      : [];
    
    return {
      featuredPrompts: processedFeaturedPrompts,
      aiGeneratedPrompts: processedAiGeneratedPrompts,
      popularPrompts: processedPopularPrompts
    };
    
  } catch (error) {
    console.error('バッチプロンプト取得エラー:', error);
    return { featuredPrompts: [], aiGeneratedPrompts: [], popularPrompts: [] };
  }
}

// 以下の関数は後方互換性のために残す
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
      profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
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
      profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
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
      profiles!prompts_author_id_fkey(id, username, display_name, avatar_url)
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
        const promptId = item.prompt_id as string;
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

  return data.map(item => (item.prompt_id as string));
}

// Supabaseから取得したデータをPromptItem形式に変換
function transformToPromptItem(item: any): PromptItem {
  // プロフィール情報を取得（存在する場合）
  const profileData = item.profiles || {};
  const displayName = profileData.display_name || '匿名';  // usernameは使わず、display_nameがなければ「匿名」

  // 日付の相対表示
  const postedAt = getRelativeTimeString(new Date(item.created_at));

  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnail_url || '/images/default-thumbnail.svg',
    user: {
      name: displayName,
      account_name: displayName,
      avatarUrl: profileData.avatar_url || DEFAULT_AVATAR_URL,
    },
    postedAt: postedAt,
    // like_countが設定されていればそれを使用（likesテーブルから取得した値）
    likeCount: item.like_count ?? 0,
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
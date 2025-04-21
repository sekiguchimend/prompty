import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

interface PromptProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  view_count: number;
  author_id: string;
  profiles: PromptProfile;
  likes: { count: number }[];
}

interface BookmarkItem {
  created_at: string;
  prompt_id: string;
  prompts: Prompt;
}

// レスポンス形式の型定義
interface BookmarkResponse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエスト以外は許可しない
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userIdは必須です' });
    }
    
    // Supabaseクライアントの初期化（サービスロールキーを使用）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseServiceKey) {
      console.error('❌ サービスロールキーが設定されていません');
      return res.status(500).json({ 
        error: 'サーバー設定エラー',
        message: 'サービスロールキーが設定されていません'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // ブックマークした記事と関連データを取得
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        prompt_id,
        prompts:prompts(
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          view_count,
          author_id,
          profiles:profiles!prompts_author_id_fkey(
            id,
            display_name,
            username,
            avatar_url
          ),
          likes(count)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // データを整形してクライアントに返す
    const bookmarks: BookmarkResponse[] = [];
    
    if (data) {
      for (const item of data) {
        // 型安全のためにanyにキャスト
        const anyItem = item as any;
        
        // Supabaseの結果にprompsプロパティがあることを確認
        if (!anyItem.prompts) continue;
        
        const prompt = anyItem.prompts as any;
        const profile = Array.isArray(prompt.profiles) 
          ? prompt.profiles[0] 
          : prompt.profiles;
          
        if (!profile) continue;
        
        bookmarks.push({
          id: prompt.id,
          title: prompt.title,
          description: prompt.description,
          thumbnailUrl: prompt.thumbnail_url,
          createdAt: prompt.created_at,
          viewCount: prompt.view_count,
          likeCount: Array.isArray(prompt.likes) && prompt.likes.length > 0 
            ? prompt.likes[0].count || 0 
            : 0,
          author: {
            id: profile.id || '',
            name: profile.display_name || profile.username || '不明なユーザー',
            username: profile.username || '',
            avatarUrl: profile.avatar_url || '/images/default-avatar.svg'
          }
        });
      }
    }
    
    return res.status(200).json({ 
      bookmarks
    });
    
  } catch (err) {
    console.error('🔴 ブックマーク一覧取得エラー:', err);
    return res.status(500).json({ 
      error: 'ブックマーク一覧の取得中にエラーが発生しました',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 
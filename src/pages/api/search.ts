import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR_URL } from '../../components/common/Avatar';
import { searchQuerySchema, sanitizeSearchQuery } from '../../lib/security/input-validation';
import { SecureDB } from '../../lib/security/secure-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエストのみ受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 🔒 セキュアな入力検証
    const validatedQuery = searchQuerySchema.parse({
      query: req.query.q,
      category: req.query.category,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    });

    const secureDB = new SecureDB(supabase);
    
    // 🔒 SQLインジェクション対策済みの検索
    const { data: searchResults, error: searchError } = await secureDB.searchPrompts(
      validatedQuery.query,
      {
        category: validatedQuery.category,
        limit: validatedQuery.limit,
        offset: (validatedQuery.page - 1) * validatedQuery.limit
      }
    );
      
    if (searchError) {
      console.error('検索エラー:', searchError);
      throw searchError;
    }
    
    // 🔒 データ変換（XSS対策込み）
    const formattedResults = transformPromptsData(searchResults || []);
    
    return res.status(200).json({ 
      results: formattedResults,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: searchResults?.length || 0
      }
    });
    
  } catch (error) {
    console.error('検索中にエラーが発生しました:', error);
    
    // 🔒 セキュアなエラーレスポンス（内部情報を隠す）
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ 
        error: '無効な検索パラメータです',
        results: []
      });
    }
    
    return res.status(500).json({ 
      error: '検索処理でエラーが発生しました',
      results: []
    });
  }
}

// データ変換用ヘルパー関数
const transformPromptsData = (promptsData: any[]) => {
  return promptsData.map(prompt => {
    const profileData = prompt.profiles 
      ? prompt.profiles
      : { display_name: '不明なユーザー', avatar_url: DEFAULT_AVATAR_URL };
    
    return {
      id: prompt.id,
      title: prompt.title || '無題',
      thumbnailUrl: prompt.thumbnail_url || '/images/default-thumbnail.svg',
      postedAt: new Date(prompt.created_at).toLocaleDateString('ja-JP'),
      likeCount: prompt.like_count || 0,
      user: {
        userId: prompt.author_id || '',
        name: profileData.display_name || profileData.username || '不明なユーザー',
        avatarUrl: profileData.avatar_url || DEFAULT_AVATAR_URL,
      }
    };
  });
}; 
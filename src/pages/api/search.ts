import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';
import { DEFAULT_AVATAR_URL } from '../../components/common/Avatar';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GETリクエストのみ受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { q: query } = req.query;
  
  // クエリパラメータチェック
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ 
      error: 'Search query is required',
      results: []
    });
  }
  
  try {
    // 検索方法を修正し、個別のフィルターを使用
    // タイトルでの検索
    const { data: titleSearchResults, error: titleSearchError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        content,
        created_at,
        price,
        author_id,
        view_count,
        profiles:profiles(id, username, display_name, avatar_url, bio)
      `)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });
      
    if (titleSearchError) {
      console.error('タイトル検索エラー:', titleSearchError);
      throw titleSearchError;
    }
    
    // プロフィール名での検索
    let profileSearchResults: any[] = [];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, 
        username,
        display_name,
        avatar_url
      `)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
      
    if (profilesError) {
      console.error('プロフィール検索エラー:', profilesError);
    } else if (profilesData && profilesData.length > 0) {
      // 見つかったプロフィールのユーザーIDで投稿を検索
      const userIds = profilesData.map(profile => profile.id);
      const { data: userPromptsData, error: userPromptsError } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          thumbnail_url,
          content,
          created_at,
          price,
          author_id,
          view_count,
          profiles:profiles(id, username, display_name, avatar_url, bio)
        `)
        .in('author_id', userIds)
        .order('created_at', { ascending: false });
        
      if (userPromptsError) {
        console.error('ユーザー投稿検索エラー:', userPromptsError);
      } else {
        profileSearchResults = userPromptsData || [];
      }
    }
    
    // 両方の検索結果を結合してユニークにする
    const allResults = [...(titleSearchResults || []), ...profileSearchResults];
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    
    // データ変換
    const formattedResults = transformPromptsData(uniqueResults || []);
    
    return res.status(200).json({ results: formattedResults });
    
  } catch (error) {
    console.error('検索中にエラーが発生しました:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
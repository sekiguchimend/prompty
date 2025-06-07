import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // サーバーサイドのSupabaseクライアントを作成（PagesルーターではreqからCookieを取得）
  const supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Pagesルーターでは、req.cookiesからクッキーを取得
          return req.cookies[name];
        },
      },
    }
  );
  
  try {
    // セッションを取得して認証を確認
    const { data: { session } } = await supabaseServerClient.auth.getSession();
    
    // 未認証の場合はエラーを返す
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    const { promptId } = req.body;
    
    // プロンプトIDの検証
    if (!promptId) {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }
    
    // いいねの状態を確認
    const { data: existingLike, error: fetchError } = await supabase
      .from('likes')
      .select('id')
      .eq('prompt_id', promptId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    let action;
    
    // 既にいいねしている場合は削除
    if (existingLike) {
      // anyを使用して型エラーを回避
      const typedExistingLike = existingLike as any;
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', typedExistingLike.id);
        
      if (deleteError) throw deleteError;
      action = 'unliked';
    } 
    // いいねしていない場合は追加
    else {
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ prompt_id: promptId, user_id: userId });
        
      if (insertError) throw insertError;
      action = 'liked';
    }
    
    // 更新後のいいね総数を取得
    const { count, error: countError } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('prompt_id', promptId);
      
    if (countError) throw countError;
    
    return res.status(200).json({
      action,
      count: count || 0
    });
    
  } catch (error) {
    console.error('いいねトグルエラー:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
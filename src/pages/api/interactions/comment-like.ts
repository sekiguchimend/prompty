import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエストのみ受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // サーバーサイドのSupabaseクライアントを作成
  const supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
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
    const { commentId } = req.body;
    
    // コメントIDの検証
    if (!commentId) {
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    // コメントが存在するか確認
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // いいねの状態を確認
    const { data: existingLike, error: fetchError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    let action;
    
    // 既にいいねしている場合は削除
    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingLike.id);
        
      if (deleteError) throw deleteError;
      action = 'unliked';
    } 
    // いいねしていない場合は追加
    else {
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });
        
      if (insertError) throw insertError;
      action = 'liked';
    }
    
    // 更新後のいいね総数を取得
    const { count, error: countError } = await supabase
      .from('comment_likes')
      .select('id', { count: 'exact' })
      .eq('comment_id', commentId);
      
    if (countError) throw countError;
    
    return res.status(200).json({
      action,
      count: count || 0,
      liked: action === 'liked'
    });
    
  } catch (error) {
    console.error('Comment like toggle error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
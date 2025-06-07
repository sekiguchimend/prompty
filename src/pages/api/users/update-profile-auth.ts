import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 update-profile API リクエスト受信:', JSON.stringify(req.body));
    const { userId, accountName, bio } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDは必須です' });
    }
    
    if (!accountName || !accountName.trim()) {
      return res.status(400).json({ error: 'ユーザー名は必須です' });
    }
    
    // Supabaseクライアントの初期化（サーバーサイドのためサービスロールキーを使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // まずプロフィールが既に存在するか確認
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    if (fetchError) {
      console.error('🔴 プロフィール取得エラー:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }
    
    const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
    
    if (!existingProfile) {
      return res.status(404).json({ error: 'プロフィールが見つかりません' });
    }
    
    console.log('🟢 既存プロフィールを更新します:', existingProfile);
    
    // 更新データを準備
    const updateData: any = {
      updated_at: new Date().toISOString(),
      display_name: accountName.trim()
    };
    
    // bioが提供されていれば更新
    if (bio !== undefined) {
      updateData.bio = bio;
    }
    
    console.log('🔄 更新データ:', updateData);
    
    // データベースを直接更新する（RLSをバイパスするため）
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (updateError) {
        console.error('🔴 プロフィール更新エラー:', updateError);
        return res.status(500).json({ error: updateError.message });
      }
      
      // 更新後のデータを取得
      const { data: updatedProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
        
      if (getError) {
        console.error('🔴 更新後のプロフィール取得エラー:', getError);
        return res.status(500).json({ error: getError.message });
      }
      
      console.log('🟢 プロフィール更新成功:', updatedProfile);
      return res.status(200).json({ 
        success: true,
        message: 'プロフィールが更新されました',
        profile: updatedProfile && updatedProfile.length > 0 ? updatedProfile[0] : null
      });
    } catch (error) {
      console.error('🔴 例外が発生しました:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      });
    }
  } catch (err) {
    console.error('🔴 全体エラー:', err);
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'サーバーエラーが発生しました' 
    });
  }
} 
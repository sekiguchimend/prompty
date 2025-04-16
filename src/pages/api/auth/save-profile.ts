import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ProfileUpdateData {
  email?: string;
  username?: string;
  updated_at?: string;
  display_name?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 save-profile API リクエスト受信:', JSON.stringify(req.body));
    const { userId, email, username, user_metadata } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDは必須です' });
    }
    
    // Supabaseクライアントの初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // プロフィールテーブルのスキーマを確認
    const { data: profileColumns, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.warn('⚠️ プロフィールテーブルのスキーマ確認エラー:', schemaError);
    } else {
      // スキーマの構造を確認
      console.log('💡 プロフィールテーブルのスキーマ:', profileColumns.length > 0 ? Object.keys(profileColumns[0]) : 'データがありません');
    }
    
    // まずプロフィールが既に存在するか確認
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
      throw fetchError;
    }
    
    // client-sideで取得したユーザーメタデータを使用
    if (user_metadata) {
      console.log('🟢 ユーザーメタデータ:', JSON.stringify(user_metadata, null, 2));
    }
    
    let result;
    
    if (existingProfile) {
      console.log('🟢 既存プロフィールを更新します:', existingProfile);
      // プロフィールが存在する場合は更新
      const updateData: ProfileUpdateData = {};
      
      // emailが提供されていれば更新
      if (email) {
        updateData.email = email;
      }
      
      // usernameが提供されていれば更新
      if (username) {
        updateData.username = username;
        
        // display_nameフィールドが存在するか確認
        if (existingProfile.hasOwnProperty('display_name') || 
            (profileColumns && profileColumns.length > 0 && 'display_name' in profileColumns[0])) {
          updateData.display_name = username;
          console.log('🟢 display_nameフィールドも更新します');
        }
      }
      
      updateData.updated_at = new Date().toISOString();
      
      console.log('🔄 更新データ:', updateData);
      
      // プロフィール更新
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
        
      if (updateError) throw updateError;
      result = data;
    } else {
      console.log('🟢 新規プロフィールを作成します');
      
      // 新規プロフィール作成用のデータ
      const newProfile: any = {
        id: userId,
        email: email || null,
        username: username || null,
        updated_at: new Date().toISOString()
      };
      
      // display_nameフィールドが存在するか確認
      if (profileColumns && profileColumns.length > 0 && 'display_name' in profileColumns[0]) {
        newProfile.display_name = username || null;
        console.log('🟢 display_nameフィールドも設定します');
      }
      
      console.log('🔄 作成データ:', newProfile);
      
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();
        
      if (insertError) throw insertError;
      result = data;
    }
    
    console.log('🟢 プロフィール保存結果:', result);
    
    return res.status(200).json({ 
      message: 'プロフィールが正常に保存されました',
      profile: result
    });
    
  } catch (err) {
    console.error('🔴 プロフィール保存エラー:', err);
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'サーバーエラーが発生しました' 
    });
  }
} 
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

interface ProfileUpdateData {
  email?: string;
  username?: string;
  updated_at?: string;
  display_name?: string;
  account_name?: string;
  bio?: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 save-profile API リクエスト受信:', JSON.stringify(req.body));
    const { userId, email, username, user_metadata, account_name, bio } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDは必須です' });
    }
    
    // Supabaseクライアントの初期化（サーバーサイドのためサービスロールキーを使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    if (fetchError) {
      throw fetchError;
    }
    
    const existingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
    
    // client-sideで取得したユーザーメタデータを使用
    if (user_metadata) {
      console.log('🟢 ユーザーメタデータ:', JSON.stringify(user_metadata, null, 2));
    }
    
    let result;
    
    if (existingProfile) {
      console.log('🟢 既存プロフィールを更新します:', existingProfile);
      // プロフィールが存在する場合は更新
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
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
      
      // account_nameが提供されていれば更新
      if (account_name) {
        updateData.account_name = account_name;
        console.log('🟢 account_nameフィールドを更新します:', account_name);
      } else if (username && !existingProfile.account_name) {
        // account_nameがない場合はusernameを設定
        updateData.account_name = username;
        console.log('🟢 account_nameフィールドをusernameで設定します:', username);
      }
      
      // bioが提供されていれば更新
      if (bio !== undefined) {
        updateData.bio = bio;
        console.log('🟢 bioフィールドを更新します:', bio);
      }
      
      console.log('🔄 更新データ:', updateData);
      
      // データベースを直接更新する（RLSをバイパスするため）
      const { error: rpcError } = await supabase.rpc('update_profile', {
        profile_id: userId,
        profile_data: updateData
      });
      
      if (rpcError) {
        console.error('🔴 RPC更新エラー:', rpcError);
        
        // 従来の方法でフォールバック
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
          
        if (updateError) throw updateError;
      }
      
      // 更新後のデータを取得
      const { data: updatedProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
        
      if (getError) throw getError;
      result = updatedProfile && updatedProfile.length > 0 ? updatedProfile[0] : existingProfile;
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
      
      // account_nameフィールドが存在するか確認
      if (profileColumns && profileColumns.length > 0 && 'account_name' in profileColumns[0]) {
        newProfile.account_name = account_name || username || null;
        console.log('🟢 account_nameフィールドも設定します:', newProfile.account_name);
      }
      
      // bioフィールドが存在するか確認
      if (profileColumns && profileColumns.length > 0 && 'bio' in profileColumns[0]) {
        newProfile.bio = bio || null;
        console.log('🟢 bioフィールドも設定します:', bio);
      }
      
      console.log('🔄 作成データ:', newProfile);
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile]);
        
      if (insertError) throw insertError;
      
      // 作成後のデータを取得
      const { data: createdProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
        
      if (getError) throw getError;
      result = createdProfile && createdProfile.length > 0 ? createdProfile[0] : newProfile;
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
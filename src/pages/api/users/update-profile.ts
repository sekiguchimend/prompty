import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// FormDataのパースを有効にする
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Supabaseクライアントの初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // フォームデータをパース
    const form = formidable({ 
      multiples: false,
      keepExtensions: true
    });
    
    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;

    // ユーザーIDは必須
    const userId = fields.userId ? 
      Array.isArray(fields.userId) ? fields.userId[0] : fields.userId : undefined;
      
    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDは必須です' });
    }

    // プロフィール情報を更新用に準備
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 表示名が提供されていれば更新
    if (fields.displayName) {
      const displayName = Array.isArray(fields.displayName) ? fields.displayName[0] : fields.displayName;
      updateData.display_name = displayName;
    }

    // 自己紹介が提供されていれば更新
    if (fields.bio !== undefined) {
      const bio = Array.isArray(fields.bio) ? fields.bio[0] : fields.bio;
      updateData.bio = bio || null;
    }

    // 場所が提供されていれば更新
    if (fields.location !== undefined) {
      const location = Array.isArray(fields.location) ? fields.location[0] : fields.location;
      updateData.location = location || null;
    }

    // アバター画像が提供されていれば処理
    const avatar = files.avatar;
    const avatarFile = Array.isArray(avatar) ? avatar[0] : avatar;
    
    if (avatarFile && avatarFile.filepath) {
      try {
        console.log('アバターアップロード処理開始:', avatarFile.originalFilename);
        
        // ファイル名を設定（avatar-{userId}-{timestamp}の形式）
        const fileExt = avatarFile.originalFilename?.split('.').pop() || 'jpg';
        const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;

        // ファイルを読み込む
        const fileBuffer = fs.readFileSync(avatarFile.filepath);
        console.log('ファイルサイズ:', fileBuffer.length, 'バイト');

        // avatarsバケットが存在するか確認
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketsError) {
          console.error('バケット一覧取得エラー:', bucketsError);
          return res.status(500).json({ 
            error: 'ストレージバケットの確認に失敗しました', 
            details: bucketsError 
          });
        }
        
        const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
        console.log('avatarsバケット存在確認:', avatarsBucketExists);
        
        if (!avatarsBucketExists) {
          // バケットが存在しない場合は作成を試みる
          const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024 // 5MB
          });
          
          if (createBucketError) {
            console.error('バケット作成エラー:', createBucketError);
            return res.status(500).json({ 
              error: 'avatarsバケットの作成に失敗しました', 
              details: createBucketError 
            });
          }
          
          console.log('avatarsバケットを作成しました');
        }

        // 古いアバター画像のURLを取得
        const { data: oldProfile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        // 古いアバター画像があれば削除
        if (oldProfile?.avatar_url) {
          const oldFileName = oldProfile.avatar_url.split('/').pop();
          if (oldFileName && oldFileName.startsWith('avatar-')) {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
            console.log('古いアバター画像を削除:', oldFileName);
          }
        }

        // 新しいアバター画像をアップロード
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, fileBuffer, {
            contentType: avatarFile.mimetype || 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('アップロードエラー:', uploadError);
          return res.status(500).json({ 
            error: 'アバター画像のアップロードに失敗しました', 
            details: uploadError 
          });
        }

        console.log('アップロード成功:', fileName);

        // 公開URLを取得
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        console.log('公開URL:', publicUrl);

        // アバターURLを更新データに追加
        updateData.avatar_url = publicUrl;
      } catch (uploadError: any) {
        console.error('アバターアップロード例外:', uploadError);
        return res.status(500).json({ 
          error: 'アバター画像の処理中にエラーが発生しました', 
          details: uploadError.message 
        });
      }
      
    } else if (fields.removeAvatar) {
      const removeAvatar = Array.isArray(fields.removeAvatar) ? fields.removeAvatar[0] : fields.removeAvatar;
      
      // アバター画像を削除する場合
      if (removeAvatar === 'true') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (profile?.avatar_url) {
          const oldFileName = profile.avatar_url.split('/').pop();
          if (oldFileName && oldFileName.startsWith('avatar-')) {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
            console.log('アバター画像を削除:', oldFileName);
          }
        }

        // アバターURLをnullに設定
        updateData.avatar_url = null;
      }
    }

    // プロフィールの更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('プロフィール更新エラー:', updateError);
      return res.status(500).json({ error: 'プロフィールの更新に失敗しました', details: updateError });
    }

    // 更新後のプロフィール情報を取得
    const { data: updatedProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (getError) {
      return res.status(500).json({ error: '更新後のプロフィール取得に失敗しました', details: getError });
    }

    return res.status(200).json({
      success: true,
      data: updatedProfile
    });

  } catch (error: any) {
    console.error('プロフィール更新エラー:', error);
    return res.status(500).json({ 
      error: '予期せぬエラーが発生しました', 
      message: error.message || 'Unknown error'
    });
  }
} 
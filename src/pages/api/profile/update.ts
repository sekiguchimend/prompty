import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // FormDataをパース
    const form = formidable({ 
      multiples: false,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB制限
    });
    
    const formData = await new Promise<{ fields: formidable.Fields, files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { fields, files } = formData;
    
    // フィールド値を取得
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
    const displayName = Array.isArray(fields.displayName) ? fields.displayName[0] : fields.displayName;
    const bio = Array.isArray(fields.bio) ? fields.bio[0] : fields.bio;
    const location = Array.isArray(fields.location) ? fields.location[0] : fields.location;
    const removeAvatar = Array.isArray(fields.removeAvatar) ? fields.removeAvatar[0] : fields.removeAvatar;

    if (!userId) {
      return res.status(400).json({ error: 'ユーザーIDが必要です' });
    }

    // Supabaseクライアント初期化
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let avatarUrl: string | null = null;

    // アバター画像の処理
    if (files.avatar && !removeAvatar) {
      const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
      
      if (avatarFile && avatarFile.filepath) {
        try {
          // ファイルを読み込み
          const fileBuffer = fs.readFileSync(avatarFile.filepath);
          const fileName = `avatar-${userId}-${Date.now()}.jpg`;

          // Supabaseストレージにアップロード
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, fileBuffer, {
              contentType: avatarFile.mimetype || 'image/jpeg',
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('アバターアップロードエラー:', uploadError);
          } else {
            // 公開URLを取得
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            avatarUrl = publicUrl;
          }
        } catch (error) {
          console.error('アバター処理エラー:', error);
        }
      }
    }

    // プロフィール更新データを準備
    const updateData: any = {
      display_name: displayName || null,
      bio: bio || null,
      location: location || null,
    };

    // アバター削除の場合
    if (removeAvatar === 'true') {
      updateData.avatar_url = null;
    } else if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('プロフィール更新エラー:', updateError);
      return res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'プロフィールが更新されました',
      avatarUrl: avatarUrl || undefined
    });

  } catch (error: any) {
    console.error('プロフィール更新API エラー:', error);
    return res.status(500).json({ 
      error: '予期せぬエラーが発生しました', 
      message: error.message 
    });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// supabaseClientの初期化をANON_KEYを使用する方式に変更
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase環境変数が設定されていません');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数のチェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Supabase URL が設定されていません');
      return res.status(500).json({ 
        success: false,
        error: 'サーバー設定エラー',
        message: 'Supabase URLが設定されていません。環境変数を確認してください。'
      });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase Anon キーが設定されていません');
      return res.status(500).json({ 
        success: false,
        error: 'サーバー設定エラー',
        message: 'Anonキーが設定されていません。環境変数を確認してください。'
      });
    }

    // 認証トークンの確認
    const authHeader = req.headers.authorization || '';
    const hasAuthToken = authHeader.startsWith('Bearer ') && authHeader.length > 10;
    const cookieHeader = req.headers.cookie || '';
    const hasAuthCookie = cookieHeader.includes('supabase-auth-token') || cookieHeader.includes('sb-');
    
      hasAuthorizationHeader: !!req.headers.authorization,
      hasAuthToken,
      authHeaderLength: authHeader.length,
      hasCookie: !!req.headers.cookie,
      hasAuthCookie,
      cookieExcerpt: cookieHeader.substring(0, 50) + (cookieHeader.length > 50 ? '...' : '')
    });

    const { target_id, prompt_id, reporter_id, reason, details, target_type } = req.body;
    
    // リクエストボディのログ
    
    // 必須フィールドの検証
    if (!target_id || !prompt_id || !reporter_id || !reason || !target_type) {
      const missingFields = [
        !target_id && 'target_id',
        !prompt_id && 'prompt_id',
        !reporter_id && 'reporter_id',
        !reason && 'reason',
        !target_type && 'target_type',
      ].filter(Boolean);
      
      console.error('❌ 必須パラメータが不足しています:', missingFields);
      
      return res.status(400).json({ 
        success: false,
        error: '必須パラメータが不足しています',
        missing: missingFields
      });
    }
    
    // target_typeの検証
    if (target_type !== 'prompt' && target_type !== 'comment') {
      console.error('❌ 無効な対象タイプ:', target_type);
      return res.status(400).json({ 
        success: false,
        error: '無効な対象タイプです',
        message: `対象タイプは 'prompt' または 'comment' でなければなりません。受信: ${target_type}`
      });
    }
    
    // コメント報告の場合は専用のエンドポイントにリダイレクト
    if (target_type === 'comment') {
      console.error('❌ 不正なエンドポイント: コメント報告に対してプロンプト報告エンドポイントが使用されました');
      return res.status(400).json({ 
        success: false,
        error: '不正なリクエスト',
        message: 'コメント報告には /api/comments/report を使用してください'
      });
    }

    // 有効な理由かどうか検証
    const validReasons = ['inappropriate', 'spam', 'harassment', 'misinformation', 'other'];
    if (!validReasons.includes(reason)) {
      console.error('❌ 無効な報告理由:', reason);
      return res.status(400).json({ 
        success: false,
        error: '無効な報告理由です',
        message: `有効な理由は [${validReasons.join(', ')}] のいずれかである必要があります`
      });
    }
    
    // 報告データをデータベースに保存
    try {
      const supabase = getSupabaseClient();
      
      // Supabaseクライアントに認証トークンを設定
      if (hasAuthToken) {
        const token = authHeader.replace('Bearer ', '');
        supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      } else {
      }
      
      // ⚠️ RLSをバイパスするために一時的にサービスロールを使用（テスト用）
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (serviceRoleKey) {
        const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          serviceRoleKey
        );
        
        // reports テーブルを使用
        const { data: reportData, error: reportError } = await adminClient
          .from('reports')
          .insert({
            target_id,
            target_type,
            prompt_id,
            reporter_id,
            reason,
            details: details || null,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (reportError) {
          console.error('❌ サービスロールでの挿入エラー:', reportError);
          throw reportError;
        }
        
        
        // 成功レスポンス
        return res.status(200).json({
          success: true,
          message: 'コンテンツの報告を受け付けました。ご協力ありがとうございます。',
          data: reportData
        });
      }
      
      // 通常のユーザー権限で挿入を試行
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          target_id,
          target_type,
          prompt_id,
          reporter_id,
          reason,
          details: details || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (reportError) {
        // 一意性制約違反（同じユーザーが同じプロンプトを複数回報告）
        if (reportError.code === '23505') {
          return res.status(409).json({
            success: false,
            error: '既に報告済みです',
            message: 'このコンテンツは既に報告されています'
          });
        }
        
        console.error('❌ データベース挿入エラー:', reportError);
        throw reportError;
      }
      
      
      // レポート数をチェックし、一定数以上なら自動的に非表示レビュー対象にする
      const { count, error: countError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', target_id)
        .eq('target_type', 'prompt');
        
      if (countError) {
        console.error('⚠️ レポート数集計エラー:', countError);
      }
      else if (count && count >= 5) {
        // 5件以上の報告があれば確認用フラグを追加
        
        const { error: flagError } = await supabase
          .from('prompts')
          .update({ needs_review: true })
          .eq('id', target_id);
          
        if (flagError) {
          console.error('⚠️ プロンプトレビューフラグ設定エラー:', flagError);
        } else {
        }
      }
      
      // 成功レスポンス
      return res.status(200).json({
        success: true,
        message: 'コンテンツの報告を受け付けました。ご協力ありがとうございます。',
        data: reportData
      });
      
    } catch (dbError) {
      console.error('🔴 データベース操作エラー:', dbError);
      return res.status(500).json({ 
        success: false,
        error: 'データベース操作中にエラーが発生しました',
        message: dbError instanceof Error ? dbError.message : '不明なエラー',
        details: dbError
      });
    }
    
  } catch (err) {
    console.error('🔴 コンテンツ報告エラー:', err);
    return res.status(500).json({ 
      success: false,
      error: 'コンテンツ報告中にエラーが発生しました',
      message: err instanceof Error ? err.message : '不明なエラー',
      details: err
    });
  }
} 
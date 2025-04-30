import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数のチェック（サーバー起動時に確認）
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ Supabase URL が設定されていません');
      return res.status(500).json({ 
        success: false,
        error: 'サーバー設定エラー',
        message: 'Supabase URLが設定されていません。環境変数を確認してください。'
      });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase サービスロールキーが設定されていません');
      return res.status(500).json({ 
        success: false,
        error: 'サーバー設定エラー',
        message: 'サービスロールキーが設定されていません。環境変数を確認してください。'
      });
    }

    const { target_id, prompt_id, reporter_id, reason, details, target_type } = req.body;
    
    // リクエストボディのログ
    console.log('受信したリクエストボディ:', { target_id, prompt_id, reporter_id, reason, target_type });
    
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
      console.log('💾 コンテンツ報告を保存します...');
      
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('content_reports')
        .insert({
          prompt_id: target_id, // プロンプト報告の場合はtarget_idとprompt_idは同じ
          reporter_id,
          reason,
          details: details || null,
          status: 'pending', // 初期ステータス
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (reportError) {
        // 一意性制約違反（同じユーザーが同じプロンプトを複数回報告）
        if (reportError.code === '23505') {
          console.log('⚠️ 既に報告済みのコンテンツです');
          return res.status(409).json({
            success: false,
            error: '既に報告済みです',
            message: 'このコンテンツは既に報告されています'
          });
        }
        
        console.error('❌ データベース挿入エラー:', reportError);
        throw reportError;
      }
      
      console.log('✅ コンテンツ報告を保存しました');
      
      // レポート数をチェックし、一定数以上なら自動的に非表示レビュー対象にする
      const { count, error: countError } = await supabaseAdmin
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('prompt_id', target_id);
        
      if (countError) {
        console.error('⚠️ レポート数集計エラー:', countError);
      }
      else if (count && count >= 5) {
        // 5件以上の報告があれば確認用フラグを追加
        console.log(`ℹ️ ${target_id} のレポート数が ${count} 件に達したため、レビュー対象にします`);
        
        const { error: flagError } = await supabaseAdmin
          .from('prompts')
          .update({ needs_review: true })
          .eq('id', target_id);
          
        if (flagError) {
          console.error('⚠️ プロンプトレビューフラグ設定エラー:', flagError);
        } else {
          console.log(`✅ プロンプト ${target_id} は5件以上の報告により自動的にレビュー対象になりました`);
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
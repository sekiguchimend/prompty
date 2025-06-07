import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // POSTリクエスト以外は許可しない
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 環境変数のチェック（サーバー起動時に確認）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    // 環境変数の検証
    if (!supabaseUrl) {
      console.error('❌ Supabase URL が設定されていません');
      return res.status(500).json({ 
        success: false,
        error: 'サーバー設定エラー',
        message: 'Supabase URLが設定されていません。環境変数を確認してください。'
      });
    }

    // ReportDialogコンポーネントからのリクエストを処理するためのデータマッピング
    // target_idがあればそれを使用し、なければcomment_idを使用
    const { target_id, comment_id: originalCommentId, prompt_id, reporter_id, reason, details, target_type } = req.body;
    const comment_id = target_id || originalCommentId; // target_idを優先して使用
    
    // リクエストボディのログ
    console.log('受信したリクエストボディ:', { 
      target_id, 
      comment_id: originalCommentId, 
      prompt_id, 
      reporter_id, 
      reason, 
      target_type 
    });
    
    // 必須フィールドの検証
    if (!comment_id || !prompt_id || !reporter_id || !reason) {
      const missingFields = [
        !comment_id && 'comment_id/target_id',
        !prompt_id && 'prompt_id',
        !reporter_id && 'reporter_id',
        !reason && 'reason',
      ].filter(Boolean);
      
      console.error('❌ 必須パラメータが不足しています:', missingFields);
      
      return res.status(400).json({ 
        success: false,
        error: '必須パラメータが不足しています',
        missing: missingFields
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
      console.log('💾 コメント報告を保存します...');
      
      const { data: reportData, error: reportError } = await supabaseAdmin
        .from('comment_reports')
        .insert({
          comment_id,
          prompt_id,
          reporter_id,
          reason,
          details: details || null,
          status: 'pending', // 初期ステータス
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (reportError) {
        // 一意性制約違反（同じユーザーが同じコメントを複数回報告）
        if (reportError.code === '23505') {
          console.log('⚠️ 既に報告済みのコメントです');
          return res.status(409).json({
            success: false,
            error: '既に報告済みです',
            message: 'このコメントは既に報告されています'
          });
        }
        
        console.error('❌ データベース挿入エラー:', reportError);
        throw reportError;
      }
      
      console.log('✅ コメント報告を保存しました');
      
      // レポート数をチェックし、一定数以上ならコメントを自動的に非表示にする
      const { count, error: countError } = await supabaseAdmin
        .from('comment_reports')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', comment_id);
        
      if (countError) {
        console.error('⚠️ レポート数集計エラー:', countError);
      }
      else if (count && count >= 3) {
        // 3件以上の報告があればコメントを非表示に
        console.log(`ℹ️ コメント ${comment_id} のレポート数が ${count} 件に達したため、非表示にします`);
        
        const { error: hideError } = await supabaseAdmin
          .from('comments')
          .update({ is_hidden: true })
          .eq('id', comment_id);
          
        if (hideError) {
          console.error('⚠️ コメント非表示設定エラー:', hideError);
        } else {
          console.log(`✅ コメント ${comment_id} は3件以上の報告により自動的に非表示になりました`);
        }
      }
      
      // 成功レスポンス
      return res.status(200).json({
        success: true,
        message: 'コメントの報告を受け付けました。ご協力ありがとうございます。',
        data: reportData
      });
      
    } catch (dbError: any) {
      console.error('🔴 データベース操作エラー:', dbError);
      return res.status(500).json({ 
        success: false,
        error: 'データベース操作中にエラーが発生しました',
        message: dbError instanceof Error ? dbError.message : '不明なエラー',
        details: dbError
      });
    }
    
  } catch (err) {
    console.error('🔴 コメント報告エラー:', err);
    return res.status(500).json({ 
      success: false,
      error: 'コメント報告中にエラーが発生しました',
      message: err instanceof Error ? err.message : '不明なエラー',
      details: err
    });
  }
} 
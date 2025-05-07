// Edge Function URL を直接クライアントに晒さない
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 環境変数の存在確認
    const funcUrl = process.env.SUPABASE_FUNC_URL;
    if (!funcUrl) {
      console.error("❌ SUPABASE_FUNC_URL環境変数が設定されていません");
      return res.status(500).json({ 
        error: "設定エラー: Edge Function URLが設定されていません",
        message: "管理者にお問い合わせください" 
      });
    }

    // 改善: スラッシュの有無を正規化してURLを構築
    const fullUrl = funcUrl.endsWith('/') 
      ? `${funcUrl}handle_prompts_insert`
      : `${funcUrl}/handle_prompts_insert`;
    
    console.log(`🔄 Edge Functionへリクエスト: ${fullUrl}`);
    console.log(`📤 リクエストボディ:`, JSON.stringify(req.body));

    // タイムアウト対策としてフェッチオプションを追加
    const fetchOptions = {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        ...req.headers as HeadersInit
      }, 
      body: JSON.stringify(req.body),
      // タイムアウトを設定（AbortControllerはフロントエンドでのみ利用可能なため、別の方法が必要）
    };

    // リクエスト開始時間を記録
    const startTime = Date.now();
    
    // Edge Functionへリクエスト
    let rsp;
    try {
      rsp = await fetch(fullUrl, fetchOptions);
      const endTime = Date.now();
      console.log(`⏱️ Edge Function応答時間: ${endTime - startTime}ms`);
    } catch (fetchError) {
      console.error("❌ Edge Function通信エラー:", fetchError);
      return res.status(500).json({ 
        error: "Edge Function通信エラー", 
        message: fetchError instanceof Error ? fetchError.message : "接続に失敗しました",
        url: fullUrl
      });
    }
    
    // レスポンスを取得
    let responseText;
    try {
      responseText = await rsp.text();
      console.log(`📥 Edge Functionレスポンス: ${rsp.status}`, responseText);
    } catch (textError) {
      console.error("❌ レスポンステキスト取得エラー:", textError);
      return res.status(500).json({ 
        error: "レスポンス処理エラー", 
        message: textError instanceof Error ? textError.message : "レスポンスの読み取りに失敗しました"
      });
    }

    // 直接レスポンスのHTTPヘッダーを検査
    console.log("📋 レスポンスヘッダー:", {
      status: rsp.status,
      statusText: rsp.statusText,
      contentType: rsp.headers.get('content-type'),
      contentLength: rsp.headers.get('content-length')
    });
    
    // 元のステータスコードでクライアントに返す
    return res.status(rsp.status).send(responseText);
  } catch (error) {
    console.error("❌ Edge Function呼び出しエラー:", error);
    // エラー情報をより詳細に返す
    return res.status(500).json({ 
      error: "Edge Function呼び出し失敗", 
      message: error instanceof Error ? error.message : "不明なエラー",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
} 
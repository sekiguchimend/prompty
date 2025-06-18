// pages/api/proxy/stripe-sync.ts
import type { NextApiRequest, NextApiResponse } from 'next';

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
    

    // 認証トークンの取得と検証
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("❌ 認証ヘッダーが不正です:", authHeader);
      return res.status(401).json({
        code: 401,
        message: "認証ヘッダーが不正またはありません"
      });
    }

    // 認証トークンの抽出
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error("❌ トークンが抽出できません");
      return res.status(401).json({
        code: 401,
        message: "認証トークンがありません"
      });
    }

    // トークン情報のデバッグ出力（本番環境では省略可能）
    const tokenLength = token.length;
    const tokenPrefix = token.substring(0, 20);
    const tokenSuffix = token.substring(tokenLength - 20);

    // フェッチオプションの設定
    const fetchOptions = {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // クライアントから受け取った認証トークンを使用
      }, 
      body: JSON.stringify(req.body),
    };

    // リクエスト開始時間を記録
    const startTime = Date.now();
    
    // Edge Functionへリクエスト
    let rsp;
    try {
      rsp = await fetch(fullUrl, fetchOptions);
      const endTime = Date.now();
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
    } catch (textError) {
      console.error("❌ レスポンステキスト取得エラー:", textError);
      return res.status(500).json({ 
        error: "レスポンス処理エラー", 
        message: textError instanceof Error ? textError.message : "レスポンスの読み取りに失敗しました"
      });
    }

    // 直接レスポンスのHTTPヘッダーを検査
      status: rsp.status,
      statusText: rsp.statusText,
      contentType: rsp.headers.get('content-type'),
      contentLength: rsp.headers.get('content-length')
    });
    
    // Edge Function からのエラーレスポンスをより詳細に処理
    if (!rsp.ok) {
      console.error(`❌ Edge Function エラーレスポンス: ${rsp.status}`, responseText);
      
      try {
        // JSONパースを試みる
        const errorData = JSON.parse(responseText);
        return res.status(rsp.status).json({
          ...errorData,
          edgeFunctionUrl: fullUrl,
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        // JSONパースに失敗した場合は生テキストを返す
        return res.status(rsp.status).json({
          error: "Edge Function エラー",
          message: responseText || "不明なエラー",
          status: rsp.status,
          edgeFunctionUrl: fullUrl,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 成功時は元のレスポンスをそのまま返す
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      return res.status(rsp.status).json(parsedResponse);
    } catch (parseError) {
      // JSONではない場合はテキストとして返す
      return res.status(rsp.status).send(responseText);
    }
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
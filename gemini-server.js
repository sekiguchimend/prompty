const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.GEMINI_PORT || 3002;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Gemini API設定
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDquv5JsikJVqweEAOtMxEt5oTEtI4IMmc';
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

// ミドルウェア設定
app.use(cors({
  origin: isDevelopment ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost'] : process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ログミドルウェア（開発環境のみ）
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`[Gemini Server] [${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'gemini-api',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gemini API Server',
    status: 'running',
    endpoints: [
      'GET /health',
      'POST /api/generate-code',
      'POST /api/improve-code',
      'POST /api/explain-code'
    ]
  });
});

// プロンプトテンプレートの生成
const generateSystemPrompt = (request) => {
  const { framework, language, styling, complexity } = request;
  
  return `あなたは優秀なフロントエンド開発者です。以下の要件に基づいてコードを生成してください：

**技術要件:**
- フレームワーク: ${framework}
- 言語: ${language}
- スタイリング: ${styling}
- 複雑さ: ${complexity}

**出力形式:**
以下のJSON形式で応答してください：

\`\`\`json
{
  "files": {
    "ファイル名": "ファイル内容"
  },
  "dependencies": ["依存関係のリスト"],
  "description": "プロジェクトの説明",
  "instructions": "使用方法や注意事項"
}
\`\`\`

**コード生成ルール:**
1. 実際に動作する完全なコードを生成する
2. ${framework}の最新のベストプラクティスに従う
3. ${styling}を使用してモダンで美しいUIを作成する
4. レスポンシブデザインを考慮する
5. アクセシビリティを考慮する
6. コメントを適切に記述する
7. エラーハンドリングを含める
8. ${complexity}レベルに適した機能を実装する

**ファイル構成:**
- メインコンポーネントファイル
- スタイルファイル（必要に応じて）
- 設定ファイル（必要に応じて）
- README.md（使用方法を記載）

ユーザーのリクエスト: `;
};

// コード生成エンドポイント
app.post('/api/generate-code', async (req, res) => {
  try {
    const request = req.body;
    
    if (!request.prompt) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }

    console.log('[Gemini] コード生成リクエスト受信:', request.prompt.substring(0, 100) + '...');

    const systemPrompt = generateSystemPrompt(request);
    const fullPrompt = systemPrompt + request.prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // JSONレスポンスを抽出
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[1]);
    
    // レスポンスの検証
    if (!parsedResponse.files || typeof parsedResponse.files !== 'object') {
      throw new Error('ファイル情報が不正です');
    }

    const result_data = {
      files: parsedResponse.files,
      dependencies: parsedResponse.dependencies || [],
      description: parsedResponse.description || 'Generated Code Project',
      instructions: parsedResponse.instructions || ''
    };

    console.log('[Gemini] コード生成完了');
    res.json(result_data);

  } catch (error) {
    console.error('[Gemini] コード生成エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'コード生成に失敗しました' 
    });
  }
});

// コード改善エンドポイント
app.post('/api/improve-code', async (req, res) => {
  try {
    const { originalCode, improvementRequest, framework } = req.body;
    
    if (!originalCode || !improvementRequest) {
      return res.status(400).json({ error: '元のコードと改善要求が必要です' });
    }

    console.log('[Gemini] コード改善リクエスト受信');

    const prompt = `以下のコードを改善してください：

**改善要求:** ${improvementRequest}
**フレームワーク:** ${framework}

**元のコード:**
${originalCode}

**出力形式:**
\`\`\`json
{
  "files": {
    "ファイル名": "改善されたファイル内容"
  },
  "dependencies": ["必要な依存関係"],
  "description": "改善内容の説明",
  "instructions": "変更点や使用方法"
}
\`\`\`

改善されたコードを生成してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[1]);
    console.log('[Gemini] コード改善完了');
    res.json(parsedResponse);

  } catch (error) {
    console.error('[Gemini] コード改善エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'コード改善に失敗しました' 
    });
  }
});

// コード説明エンドポイント
app.post('/api/explain-code', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'コードが必要です' });
    }

    console.log('[Gemini] コード説明リクエスト受信');

    const prompt = `以下のコードについて、わかりやすく説明してください：

${code}

**説明に含めてください:**
1. コードの目的と機能
2. 主要な技術やライブラリ
3. コードの構造
4. 重要な部分の解説
5. 使用方法

日本語で詳しく説明してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    console.log('[Gemini] コード説明完了');
    res.json({ explanation });

  } catch (error) {
    console.error('[Gemini] コード説明エラー:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'コード説明に失敗しました' 
    });
  }
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found on Gemini server`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/generate-code',
      'POST /api/improve-code',
      'POST /api/explain-code'
    ]
  });
});

// エラーハンドラー
app.use((error, req, res, next) => {
  console.error('[Gemini] Server Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong'
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🤖 Gemini API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${isDevelopment ? 'http://localhost:3000, http://localhost:3001, http://localhost' : process.env.FRONTEND_URL}`);
  
  if (isDevelopment) {
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Gemini API: http://localhost:${PORT}/api/`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   POST http://localhost:${PORT}/api/generate-code`);
    console.log(`   POST http://localhost:${PORT}/api/improve-code`);
    console.log(`   POST http://localhost:${PORT}/api/explain-code`);
  }
});

module.exports = app; 
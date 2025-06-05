const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.GEMINI_PORT || 3002;
const isDevelopment = process.env.NODE_ENV !== 'production';

// APIキー設定
const API_KEYS = {
  gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDquv5JsikJVqweEAOtMxEt5oTEtI4IMmc',
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY
};

// Gemini API設定
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// モデル設定
const getGeminiModel = (modelName = 'gemini-2.0-flash-exp') => {
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    }
  });
};

// OpenAI API呼び出し関数
const callOpenAI = async (prompt, model = 'gpt-4') => {
  if (!API_KEYS.openai) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEYS.openai}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Claude API呼び出し関数
const callClaude = async (prompt, model = 'claude-3-sonnet-20240229') => {
  if (!API_KEYS.anthropic) {
    throw new Error('Anthropic APIキーが設定されていません');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEYS.anthropic,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 8192,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
};

// 統一されたAI呼び出し関数
const callAI = async (prompt, model = 'gemini-2.0-flash') => {
  console.log(`[AI Server] 使用モデル: ${model}`);
  
  if (model.startsWith('gemini')) {
    const geminiModel = getGeminiModel(model + '-exp');
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } else if (model.startsWith('gpt')) {
    return await callOpenAI(prompt, model);
  } else if (model.startsWith('claude')) {
    const claudeModel = model === 'claude-3-sonnet' ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307';
    return await callClaude(prompt, claudeModel);
  } else {
    throw new Error(`サポートされていないモデルです: ${model}`);
  }
};

// ミドルウェア設定
app.use(cors({
  origin: isDevelopment ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost'] : process.env.FRONTEND_URL,
  credentials: true
}));

// シンプルなJSONパーサーを使用してiconv-lite問題を回避
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

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
  
  return `あなたは優秀なフロントエンド開発者です。ユーザーのリクエストに基づいて、最適な技術スタックを自動選択してコードを生成してください。

**自動選択の指針:**
- フレームワーク: リクエスト内容に最適なもの（React, Next.js, Vue, Svelte, Vanilla JS等）
- 言語: TypeScriptを優先（特別な理由がない限り）
- スタイリング: モダンな手法を優先（Tailwind CSS, CSS Modules, Styled-components等）
- 複雑さ: リクエスト内容の要求レベルに応じて適切に判断

**指定された技術要件（ある場合のみ考慮）:**
${framework ? `- フレームワーク: ${framework}` : ''}
${language ? `- 言語: ${language}` : ''}
${styling ? `- スタイリング: ${styling}` : ''}
${complexity ? `- 複雑さ: ${complexity}` : ''}

**出力形式:**
以下のJSON形式で応答してください：

\`\`\`json
{
  "files": {
    "ファイル名": "ファイル内容"
  },
  "dependencies": ["依存関係のリスト"],
  "description": "プロジェクトの説明",
  "instructions": "使用方法や注意事項",
  "techStack": {
    "framework": "選択したフレームワーク",
    "language": "選択した言語",
    "styling": "選択したスタイリング手法",
    "complexity": "判定した複雑さレベル"
  }
}
\`\`\`

**コード生成ルール:**
1. 実際に動作する完全なコードを生成する
2. 選択したフレームワークの最新のベストプラクティスに従う
3. 選択したスタイリング手法を使用してモダンで美しいUIを作成する
4. レスポンシブデザインを考慮する
5. アクセシビリティを考慮する
6. コメントを適切に記述する
7. エラーハンドリングを含める
8. リクエスト内容に適した機能を実装する
9. 必要に応じて状態管理やルーティングも含める

**ファイル構成:**
- メインコンポーネントファイル
- スタイルファイル（必要に応じて）
- 設定ファイル（必要に応じて）
- package.json（依存関係を含む）
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

    const selectedModel = request.model || 'gemini-2.0-flash';
    console.log(`[AI Server] コード生成リクエスト受信: ${request.prompt.substring(0, 100)}... (モデル: ${selectedModel})`);

    const systemPrompt = generateSystemPrompt(request);
    const fullPrompt = systemPrompt + request.prompt;

    const text = await callAI(fullPrompt, selectedModel);

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
      instructions: parsedResponse.instructions || '',
      techStack: parsedResponse.techStack || {},
      usedModel: selectedModel
    };

    console.log(`[AI Server] コード生成完了 (モデル: ${selectedModel})`);
    res.json(result_data);

  } catch (error) {
    console.error(`[AI Server] コード生成エラー:`, error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'コード生成に失敗しました' 
    });
  }
});

// コード改善エンドポイント
app.post('/api/improve-code', async (req, res) => {
  try {
    const { originalCode, improvementRequest, framework, model } = req.body;
    
    if (!originalCode || !improvementRequest) {
      return res.status(400).json({ error: '元のコードと改善要求が必要です' });
    }

    const selectedModel = model || 'gemini-2.0-flash';
    console.log(`[AI Server] コード改善リクエスト受信 (モデル: ${selectedModel})`);

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
  "instructions": "変更点や使用方法",
  "techStack": {
    "framework": "使用フレームワーク",
    "language": "使用言語", 
    "styling": "スタイリング手法"
  }
}
\`\`\`

改善されたコードを生成してください。`;

    const text = await callAI(prompt, selectedModel);

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりませんでした');
    }

    const parsedResponse = JSON.parse(jsonMatch[1]);
    parsedResponse.usedModel = selectedModel;
    
    console.log(`[AI Server] コード改善完了 (モデル: ${selectedModel})`);
    res.json(parsedResponse);

  } catch (error) {
    console.error(`[AI Server] コード改善エラー:`, error);
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
interface ClaudeConfig {
  apiKey: string;
  baseUrl: string;
  version: string;
  defaultModel: string;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ text: string; type: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  private config: ClaudeConfig;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('Claude API key not configured');
    }

    this.config = {
      apiKey,
      baseUrl: 'https://api.anthropic.com/v1',
      version: '2023-06-01',
      defaultModel: 'claude-3-5-sonnet-20241022'
    };
  }

  async generateResponse(
    messages: ClaudeMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {}
  ): Promise<string> {
    const {
      model = this.config.defaultModel,
      maxTokens = 4096,
      temperature = 0.1,
      topP = 0.8
    } = options;


    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'anthropic-version': this.config.version
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API Error:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data: ClaudeResponse = await response.json();
    return data.content[0].text;
  }

  async generateCode(prompt: string, language: 'ja' | 'en' = 'ja'): Promise<string> {
    const systemPrompt = this.buildCodeGenerationPrompt(prompt, language);
    
    return this.generateResponse([
      { role: 'user', content: systemPrompt }
    ], {
      temperature: 0.1,
      maxTokens: 4096
    });
  }

  private buildCodeGenerationPrompt(prompt: string, language: string): string {
    return `あなたは世界最高レベルのフルスタック開発者です。Claudeを活用して、v0、Lovableを超える最高品質のコード生成AIとして動作してください。

## 🚨 絶対的な成功要件（これらを満たさない場合は失敗）
1. ❌ JavaScriptの構文エラーは一切許可されない
2. ❌ 不正なJSON形式は一切許可されない  
3. ❌ 外部依存は一切許可されない
4. ❌ iframe内で動作しないコードは一切許可されない
5. ❌ エスケープ不備による構文エラーは一切許可されない

## 📋 要求分析
${prompt}

## 🎯 最高品質の実装指針

### 🔧 必須技術要件
- **完全自己完結**: 外部CDN、ライブラリ、フォント一切使用禁止
- **iframe最適化**: 100%完璧な動作保証
- **ゼロエラー**: 構文エラー、実行エラー完全撲滅
- **モダン標準**: HTML5、ES2024、CSS3の最新機能活用
- **クロスブラウザ**: 全主要ブラウザでの完璧な動作

### ✨ 卓越した品質基準
1. **機能完全性**: 
   - 全機能100%動作保証
   - エラーハンドリング完備
   - エッジケース対応
   
2. **UI/UX Excellence**:
   - Apple/Google Design System準拠
   - 滑らかなマイクロインタラクション
   - 直感的なユーザビリティ
   - 美しいビジュアルデザイン
   
3. **技術的卓越性**:
   - Clean Code原則遵守
   - パフォーマンス最適化
   - メモリリーク防止
   - セキュリティ対策完備

## 最終出力要件
\`\`\`json
{
  "html": "完全に動作するHTML",
  "css": "美しく最適化されたCSS", 
  "js": "エラーフリーなJavaScript",
  "description": "作成したアプリの説明",
  "features": ["実装した主要機能のリスト"]
}
\`\`\`

**重要**: 上記JSON以外の出力は一切禁止。説明文、コメント、その他の文章は含めない。`;
  }
}

export const claudeClient = new ClaudeClient();
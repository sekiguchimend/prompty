import { SupabaseClient } from '@supabase/supabase-js';

// セキュアなデータベースクエリ用のヘルパー関数

export class SecureDB {
  constructor(private db: SupabaseClient) {}

  // セキュアな検索クエリ（SQLインジェクション対策）
  async searchPrompts(sanitizedQuery: string, options: {
    category?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { category, limit = 20, offset = 0 } = options;

    let query = this.db
      .from('prompts')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        media_type,
        view_count,
        like_count,
        created_at,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .eq('published', true)
      .eq('is_public', true);

    // パラメータ化クエリを使用（SQLインジェクション対策）
    if (sanitizedQuery) {
      query = query.textSearch('fts', sanitizedQuery, {
        type: 'websearch',
        config: 'english'
      });
    }

    if (category) {
      query = query.eq('categories.slug', category);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return query;
  }

  // セキュアなユーザー検索
  async searchUsers(sanitizedQuery: string, limit: number = 20) {
    return this.db
      .from('profiles')
      .select('id, username, display_name, avatar_url, followers_count')
      .textSearch('fts', sanitizedQuery, {
        type: 'websearch',
        config: 'english'
      })
      .limit(limit);
  }

  // プロンプト作成時の権限チェック
  async createPromptWithAuth(promptData: any, userId: string) {
    // author_idが改ざんされていないか確認
    if (promptData.author_id && promptData.author_id !== userId) {
      throw new Error('権限エラー: 他のユーザーとしてコンテンツを作成することはできません');
    }

    // データベース制約に合わせたデータ準備
    const secureData = {
      author_id: userId, // 絶対に上書き
      title: promptData.title || promptData.prompt_title, // titleは必須で5文字以上
      description: promptData.description || '',
      content: promptData.content || promptData.prompt_content, // contentは必須で10文字以上
      prompt_title: promptData.prompt_title || promptData.title,
      prompt_content: promptData.prompt_content || promptData.content,
      thumbnail_url: promptData.thumbnail_url || null,
      ai_model: promptData.ai_model || null, // AIモデル情報を保存
      media_type: promptData.media_type || 'image',
      category_id: promptData.category_id || null,
      price: promptData.price || 0,
      is_free: promptData.is_free !== undefined ? promptData.is_free : true,
      is_premium: promptData.is_premium !== undefined ? promptData.is_premium : false,
      is_featured: promptData.is_featured !== undefined ? promptData.is_featured : false,
      published: promptData.published !== undefined ? promptData.published : true,
      site_url: promptData.site_url || null,
      preview_lines: promptData.preview_lines || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // データベース制約の事前チェック
    if (!secureData.title || secureData.title.length < 5) {
      throw new Error('タイトルは5文字以上である必要があります');
    }

    if (!secureData.content || secureData.content.length < 10) {
      throw new Error('コンテンツは10文字以上である必要があります');
    }

    return this.db
      .from('prompts')
      .insert(secureData)
      .select()
      .single();
  }

  // プロンプト更新時の所有者チェック
  async updatePromptWithAuth(promptId: string, updateData: any, userId: string) {
    // まず所有者チェック
    const { data: existingPrompt, error: checkError } = await this.db
      .from('prompts')
      .select('author_id')
      .eq('id', promptId)
      .single();

    if (checkError || !existingPrompt) {
      throw new Error('プロンプトが見つかりません');
    }

    if (existingPrompt.author_id !== userId) {
      throw new Error('権限エラー: このプロンプトを編集する権限がありません');
    }

    // 安全な更新データ
    const secureUpdateData = {
      ...updateData,
      author_id: userId, // 改ざん防止
      updated_at: new Date().toISOString(),
    };

    return this.db
      .from('prompts')
      .update(secureUpdateData)
      .eq('id', promptId)
      .eq('author_id', userId) // 追加の安全チェック
      .select()
      .single();
  }

  // セキュアな削除（所有者チェック付き）
  async deletePromptWithAuth(promptId: string, userId: string) {
    const result = await this.db
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .eq('author_id', userId) // 所有者のみ削除可能
      .select()
      .single();

    if (!result.data) {
      throw new Error('削除権限がないか、プロンプトが見つかりません');
    }

    return result;
  }

  // 管理者専用クエリ（追加の認証チェック付き）
  async adminQuery(query: string, params: any[], adminUserId: string) {
    // 管理者権限チェック
    const { data: adminCheck } = await this.db
      .from('profiles')
      .select('is_admin')
      .eq('id', adminUserId)
      .single();

    if (!adminCheck?.is_admin) {
      throw new Error('管理者権限が必要です');
    }

    // パラメータ化クエリのみ実行
    return this.db.rpc('secure_admin_query', {
      query_text: query,
      query_params: params
    });
  }

  // セキュアなビューカウント増加
  async incrementViewCount(promptId: string, userId?: string) {
    // 重複カウント防止のため、ユーザーIDがある場合はビュー履歴をチェック
    if (userId) {
      const { data: existingView } = await this.db
        .from('prompt_views')
        .select('id')
        .eq('prompt_id', promptId)
        .eq('user_id', userId)
        .single();

      if (existingView) {
        return; // 既にビューしている場合はカウントしない
      }

      // ビュー履歴を記録
      await this.db
        .from('prompt_views')
        .insert({
          prompt_id: promptId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        });
    }

    // カウンター更新
    return this.db.rpc('increment_view_count', { 
      prompt_id: promptId 
    });
  }
}

// レート制限対応のDBヘルパー
export class RateLimitedDB extends SecureDB {
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  async withRateLimit(
    userId: string,
    action: string,
    maxRequests: number,
    windowMs: number,
    operation: () => Promise<any>
  ) {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const limit = this.rateLimits.get(key);

    if (limit && now < limit.resetTime) {
      if (limit.count >= maxRequests) {
        throw new Error('レート制限に達しました。しばらく待ってから再試行してください。');
      }
      limit.count++;
    } else {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    }

    return operation();
  }
}
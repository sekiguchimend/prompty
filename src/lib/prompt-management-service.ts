import { supabase } from './supabaseClient';

export interface PromptManagementResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class PromptManagementService {
  /**
   * 記事を非公開にする
   * @param promptId プロンプトのID
   * @returns 処理結果
   */
  static async unpublishPrompt(promptId: string): Promise<PromptManagementResult> {
    try {
      // 認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        return {
          success: false,
          error: 'ログインが必要です'
        };
      }

      // APIを呼び出して非公開に設定
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          published: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '非公開設定に失敗しました');
      }

      return {
        success: true,
        message: '記事を非公開にしました'
      };

    } catch (error) {
      console.error('記事非公開エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '非公開設定中にエラーが発生しました'
      };
    }
  }

  /**
   * 記事を公開する
   * @param promptId プロンプトのID
   * @returns 処理結果
   */
  static async publishPrompt(promptId: string): Promise<PromptManagementResult> {
    try {
      // 認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        return {
          success: false,
          error: 'ログインが必要です'
        };
      }

      // APIを呼び出して公開に設定
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          published: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '公開設定に失敗しました');
      }

      return {
        success: true,
        message: '記事を公開しました'
      };

    } catch (error) {
      console.error('記事公開エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '公開設定中にエラーが発生しました'
      };
    }
  }

  /**
   * 記事を削除する
   * @param promptId プロンプトのID
   * @returns 処理結果
   */
  static async deletePrompt(promptId: string): Promise<PromptManagementResult> {
    try {
      // 認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        return {
          success: false,
          error: 'ログインが必要です'
        };
      }

      // APIを呼び出して削除
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '削除に失敗しました');
      }

      return {
        success: true,
        message: '記事を削除しました'
      };

    } catch (error) {
      console.error('記事削除エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '削除中にエラーが発生しました'
      };
    }
  }

  /**
   * ユーザーの投稿一覧を取得する
   * @param published 公開状態でフィルタ（省略すると全件）
   * @returns プロンプト一覧
   */
  static async getUserPrompts(published?: boolean) {
    try {
      // 認証状態を確認
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('ログインが必要です');
      }

             let query = supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          media_type,
          published,
          is_free,
          price,
          view_count,
          like_count,
          created_at,
          updated_at,
          category_id,
          categories:category_id (
            id,
            name,
            slug
          )
        `)
        .eq('author_id', session.user.id)
        .order('created_at', { ascending: false });

      // 公開状態でフィルタ
      if (published !== undefined) {
        query = query.eq('published', published);
      }

            const { data, error } = await query;

      if (error) {
        console.error('Supabaseクエリエラー:', {
          error,
          query: query.toString(),
          userId: session.user.id
        });
        throw error;
      }

      // データの変換処理（categoriesが配列の場合は最初の要素を取得）
      const transformedData = (data || []).map(prompt => ({
        ...prompt,
        categories: Array.isArray(prompt.categories) 
          ? (prompt.categories.length > 0 ? prompt.categories[0] : null)
          : prompt.categories
      }));

      return {
        success: true,
        data: transformedData
      };

    } catch (error) {
      console.error('プロンプト一覧取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'データ取得中にエラーが発生しました',
        data: []
      };
    }
  }
} 
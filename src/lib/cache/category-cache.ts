import { supabase } from '../supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
}

class CategoryCache {
  private data: Category[] | null = null;
  private timestamp: number = 0;
  private readonly duration: number = 300000; // 5分
  private loading: boolean = false;
  private loadingPromise: Promise<Category[] | null> | null = null;

  async get(): Promise<Category[]> {
    // キャッシュが有効な場合は即座に返す
    if (this.data && Date.now() - this.timestamp < this.duration) {
      return this.data;
    }

    // 既に読み込み中の場合は、その結果を待つ
    if (this.loading && this.loadingPromise) {
      const result = await this.loadingPromise;
      return result || [];
    }

    // 新規読み込み開始
    this.loading = true;
    this.loadingPromise = this.load();
    
    try {
      const result = await this.loadingPromise;
      return result || [];
    } finally {
      this.loading = false;
      this.loadingPromise = null;
    }
  }

  private async load(): Promise<Category[] | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('カテゴリの取得に失敗しました:', error);
        // エラーの場合も古いキャッシュがあれば返す
        return this.data;
      }
      
      if (data) {
        this.data = data;
        this.timestamp = Date.now();
      }
      
      return data;
    } catch (error) {
      console.error('カテゴリの取得中にエラーが発生しました:', error);
      // エラーの場合も古いキャッシュがあれば返す
      return this.data;
    }
  }

  // キャッシュを無効化（カテゴリが追加/更新された時用）
  invalidate(): void {
    this.data = null;
    this.timestamp = 0;
  }

  // キャッシュをプリロード（アプリケーション起動時用）
  async preload(): Promise<void> {
    await this.get();
  }
}

// シングルトンインスタンス
export const categoryCache = new CategoryCache(); 
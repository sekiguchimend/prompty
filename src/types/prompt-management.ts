// プロンプト管理機能で使用する型定義

export interface PromptCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PromptManagementData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_type: 'image' | 'video';
  published: boolean;
  is_free: boolean;
  price: number;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string | null;
  category_id: string | null;
  categories: PromptCategory | null;
} 
import { UserSummary } from './user';
import { Category } from './category';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail_url: string | null;
  author_id: string;
  category_id: string | null;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  is_public: boolean;
  is_featured: boolean;
  is_premium: boolean;
  price: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  free_preview_lines?: number;
}

export interface PromptWithRelations extends Prompt {
  author: UserSummary;
  category?: Category;
  tags?: Tag[];
  is_liked?: boolean;
  is_bookmarked?: boolean;
  has_purchased?: boolean;
}

export interface PromptSummary {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  author: UserSummary;
  view_count: number;
  like_count: number;
  is_premium: boolean;
  price: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface PromptStats {
  view_count: number;
  like_count: number;
  bookmark_count: number;
  comment_count: number;
  purchase_count?: number;
}
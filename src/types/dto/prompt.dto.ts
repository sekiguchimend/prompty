export interface CreatePromptDTO {
  title: string;
  description: string;
  content: string;
  category_id?: string;
  tags?: string[];
  thumbnail_url?: string;
  is_public?: boolean;
  is_featured?: boolean;
  is_premium?: boolean;
  price?: number;
  free_preview_lines?: number;
}

export interface UpdatePromptDTO extends Partial<CreatePromptDTO> {
  id: string;
}

export interface PromptFilterDTO {
  category?: string;
  tags?: string[];
  is_featured?: boolean;
  is_premium?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: 'created_at' | 'updated_at' | 'view_count' | 'like_count' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PromptSearchDTO {
  query: string;
  filters?: PromptFilterDTO;
}

export interface PromptResponseDTO {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  stats: {
    view_count: number;
    like_count: number;
    bookmark_count: number;
    comment_count: number;
  };
  is_premium: boolean;
  price: number;
  created_at: string;
  updated_at: string;
}
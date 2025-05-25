// API関連の型定義

// 基本的なAPIレスポンス
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

// データ付きAPIレスポンス
export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// ページネーション付きAPIレスポンス
export interface PaginatedApiResponse<T = any> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// APIエラーレスポンス
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// フェッチオプション
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

// プロンプト関連API
export interface PromptCreateRequest {
  title: string;
  description: string;
  content: string;
  category_id?: string;
  tags?: string[];
  thumbnail_url?: string;
  is_public?: boolean;
  is_featured?: boolean;
}

export interface PromptUpdateRequest extends Partial<PromptCreateRequest> {
  id: string;
}

export interface PromptResponse {
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
  is_public: boolean;
  is_featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

// ユーザー関連API
export interface UserProfileRequest {
  display_name?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

// いいね関連API
export interface LikeRequest {
  prompt_id: string;
  user_id: string;
}

export interface LikeResponse {
  id: string;
  prompt_id: string;
  user_id: string;
  created_at: string;
}

// ブックマーク関連API
export interface BookmarkRequest {
  prompt_id: string;
  user_id: string;
}

export interface BookmarkResponse {
  id: string;
  prompt_id: string;
  user_id: string;
  created_at: string;
}

// コメント関連API
export interface CommentCreateRequest {
  prompt_id: string;
  content: string;
  parent_id?: string;
}

export interface CommentResponse {
  id: string;
  prompt_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: CommentResponse[];
}

// フォロー関連API
export interface FollowRequest {
  following_id: string;
}

export interface FollowResponse {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// 報告関連API
export interface ReportRequest {
  target_type: 'prompt' | 'comment' | 'user';
  target_id: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'misinformation' | 'other';
  details?: string;
  prompt_id?: string;
}

export interface ReportResponse {
  id: string;
  target_type: string;
  target_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

// 検索関連API
export interface SearchRequest {
  query: string;
  type?: 'prompts' | 'users' | 'all';
  category?: string;
  tags?: string[];
  sort_by?: 'relevance' | 'created_at' | 'updated_at' | 'view_count' | 'like_count';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  prompts: PromptResponse[];
  users: UserProfileResponse[];
  total_count: number;
  query: string;
  filters: {
    category?: string;
    tags?: string[];
  };
}

// カテゴリ関連API
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  post_count: number;
  created_at: string;
  updated_at: string;
}

// 通知関連API
export interface NotificationResponse {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

// 統計関連API
export interface StatsResponse {
  total_prompts: number;
  total_users: number;
  total_likes: number;
  total_views: number;
  popular_categories: Array<{
    category: CategoryResponse;
    post_count: number;
  }>;
  trending_tags: Array<{
    name: string;
    count: number;
  }>;
} 
// 共通のコンポーネント型定義

// ユーザー情報の型
export interface User {
  id: string;
  name: string;
  account_name?: string;
  avatarUrl: string;
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
}

// プロンプトアイテムの型
export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: User;
  postedAt: string;
  likeCount: number;
  viewCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  description?: string;
  category?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

// カテゴリの型
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color?: string;
  icon?: string;
}

// カテゴリコンテンツの型
export interface CategoryContent {
  category: Category;
  prompts: PromptItem[];
}

// アイコンサイズの型
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// コンポーネントサイズの型
export type ComponentSize = 'sm' | 'md' | 'lg';

// アクションボタンの型
export interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: ComponentSize;
  className?: string;
}

// ドロップダウンメニューアイテムの型
export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

// モーダル基本プロパティの型
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

// ローディング状態の型
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: any;
}

// ペジネーション情報の型
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// フィルター情報の型
export interface FilterOptions {
  category?: string;
  tags?: string[];
  sortBy?: 'latest' | 'popular' | 'liked' | 'viewed';
  sortOrder?: 'asc' | 'desc';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 検索結果の型
export interface SearchResult<T> {
  items: T[];
  pagination: PaginationInfo;
  filters: FilterOptions;
  query?: string;
}

// API レスポンスの基本型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// リスト項目の基本型
export interface ListItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  metadata?: Record<string, any>;
}

// タブ情報の型
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

// 通知の型
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
} 
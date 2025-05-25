// ========================================
// コンポーネント統一エクスポートファイル
// Tree Shaking最適化のため、必要なコンポーネントのみをエクスポート
// ========================================

// === 基本UIコンポーネント ===
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Textarea } from './ui/textarea';
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
export { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';

// === アイコンシステム ===
export * from './ui/icons';

// === 共通コンポーネント ===
export { Avatar as CommonAvatar } from './common/Avatar';
export { default as UnifiedAvatar } from './common/Avatar';
export { DEFAULT_AVATAR_URL } from './common/Avatar';
export { default as LazyImage } from './common/LazyImage';
export { default as OptimizedPromptCard } from './common/OptimizedPromptCard';

// === ヘッダー関連コンポーネント ===
export { SearchBar } from './header/SearchBar';
export { NavigationTabs } from './header/NavigationTabs';

// === プロンプト関連コンポーネント ===
export { PromptGridContainer } from './prompt/PromptGridContainer';
export { PromptCardGrid } from './prompt/PromptCardGrid';
export { ViewAllCard } from './prompt/ViewAllCard';
export { ScrollControls } from './prompt/ScrollControls';

// === レイアウトコンポーネント ===
export { default as Header } from './Header';
export { default as Footer } from './footer';
export { default as Sidebar } from './Sidebar';

// === ページコンポーネント ===
export { default as HomePage } from './home-page';

// === フォーム・モーダル関連 ===
export { default as ProfileEditModal } from './profile-edit-modal';

// === その他の重要なコンポーネント ===
export { default as PromptCard } from './prompt-card';
export { default as PromptSection } from './prompt-section';
export { default as UserMenu } from './user-menu';
export { default as NotificationDropdown } from './notification-dropdown';
export { default as FeedbackDropdown } from './feedback-dropdown';
export { default as ViewCounter } from './view-counter';
export { default as SectionHeader } from './section-header';
export { default as PopularArticles } from './popular-articles';
export { default as ArticleDropdownMenu } from './article-dropdown-menu';
export { default as ArticleActionsMenu } from './article-actions-menu';
export { default as HeaderAnnouncements } from './header-announcements';
export { default as Announcements } from './announcements';

// ========================================
// 型定義のエクスポート
// ========================================
export type { PromptItem, User, Category, CategoryContent } from '../types/components';
export type { IconSize, ComponentSize } from '../types/components'; 
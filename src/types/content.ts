import { UserData } from './profile';

// 投稿データ型定義
export interface PostData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_premium: boolean;
  price: number;
  author?: {
    id: string;
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

// マガジンデータ型定義
export interface MagazineData {
  id: string;
  title: string;
  cover_url: string | null;
  articles_count: number;
}

// フォーマット関数

// 日付を「〜分前」「〜時間前」などの形式でフォーマットする
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes}分前`;
    }
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

// サムネイル画像URLの取得関数
export function getThumbnailUrl(url: string | null | undefined): string {
  return url || '/images/default-thumbnail.svg';
}

// マガジンカバー画像URLの取得関数
export function getCoverUrl(url: string | null | undefined): string {
  return url || '/images/magazine-placeholder.png';
} 
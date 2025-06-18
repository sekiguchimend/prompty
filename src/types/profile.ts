// プロフィールデータ型定義
export interface ProfileData {
  id: string;
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
}

// ユーザーデータ型定義
export interface UserData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_following?: boolean;
  is_follower?: boolean;
}

// ユーザー表示名を取得する関数
// nullや空文字の場合は「ユーザー」を返す
export function getDisplayName(displayName: string | null | undefined, fallbackName?: string): string {
  return displayName && displayName.trim() !== '' ? displayName : (fallbackName || 'ユーザー');
}

// アバター画像URLの取得関数
// nullや空文字の場合はデフォルト画像を返す
import { DEFAULT_AVATAR_URL } from '../components/index';

export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  return avatarUrl || DEFAULT_AVATAR_URL;
} 
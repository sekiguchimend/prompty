/**
 * アバター画像に関するユーティリティ関数
 */

// アバターユーティリティ関数
import { DEFAULT_AVATAR_URL } from '../components/index';

/**
 * アバターURLを取得する
 * nullや空文字、無効なURLの場合はデフォルト画像を返す
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  // nullまたは空文字の場合
  if (!avatarUrl || avatarUrl.trim() === '') {
    return DEFAULT_AVATAR_URL;
  }
  
  // 一時的なGitHubプレースホルダーの場合はデフォルトに置き換え
  if (avatarUrl.includes('github.com/shadcn.png')) {
    return DEFAULT_AVATAR_URL;
  }
  
  return avatarUrl;
}

/**
 * 表示名からアバターのフォールバック文字を生成する
 * 日本語の場合は最初の文字、英語の場合は最初の2文字を返す
 */
export function getAvatarFallback(displayName: string | null | undefined): string {
  if (!displayName || displayName.trim() === '') {
    return 'U'; // User
  }
  
  const name = displayName.trim();
  
  // 日本語文字が含まれている場合は最初の1文字
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name)) {
    return name.charAt(0);
  }
  
  // 英語の場合は最初の2文字（スペースがあれば名前と苗字の頭文字）
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
}

/**
 * 表示名を取得する
 * nullや空の場合、または自動生成されたusernameの場合は「ユーザー」を返す
 */
export function getDisplayName(displayName: string | null | undefined, fallbackName?: string): string {
  // displayNameが有効な場合はそれを返す
  if (displayName && displayName.trim() !== '') {
    return displayName.trim();
  }
  
  // fallbackNameが自動生成されたusername（user_で始まる）の場合は「ユーザー」を返す
  if (fallbackName && fallbackName.startsWith('user_')) {
    return 'ユーザー';
  }
  
  // その他の場合はfallbackNameまたは「ユーザー」を返す
  return fallbackName || 'ユーザー';
}

// プロフィール画像のURLを安全に取得する関数
export function getSafeAvatarUrl(avatarUrl?: string | null): string {
  return avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : DEFAULT_AVATAR_URL;
}

// ユーザー名からイニシャルを生成する関数
export function getInitialsFromName(name?: string): string {
  if (!name || name.trim() === '') return '匿';
  
  // 日本語の場合は最初の1文字を返す
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name)) {
    return name.charAt(0);
  }
  
  // 英語の場合は最初の文字を大文字で返す
  return name.charAt(0).toUpperCase();
} 
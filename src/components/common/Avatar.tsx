import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

// デフォルトアバター画像のパス（統一）
export const DEFAULT_AVATAR_URL = '/images/default-avatar.svg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

// サイズのマッピング
const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

// アイコンサイズのマッピング
const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

/**
 * 統一的なアバターコンポーネント
 * デフォルトアイコンとフォールバック表示を自動的に処理
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'アバター',
  displayName = '匿名',
  size = 'md',
  className,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  
  // アバターURLの正規化（nullや空文字の場合はnullにしてフォールバック表示）
  const avatarUrl = src && src.trim() !== '' ? src : null;

  // 画像読み込みエラーのハンドラー
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {!imageError && avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={alt}
          fill
          className="object-cover"
          onError={handleImageError}
        />
      ) : (
        // 画像読み込みエラーまたは画像がない場合は人型アイコンを表示
        <div className="absolute inset-0 flex items-center justify-center bg-gray-400 text-white">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn('text-white', iconSizes[size])}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default Avatar; 
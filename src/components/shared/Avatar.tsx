import React, { useState, memo } from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

export const DEFAULT_AVATAR_URL = '/images/default-avatar.svg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

export const Avatar: React.FC<AvatarProps> = memo(({
  src,
  alt = 'Avatar',
  displayName = 'Anonymous',
  size = 'md',
  className,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  
  const avatarUrl = src && src.trim() !== '' ? src : null;

  const handleImageError = () => {
    setImageError(true);
  };

  const getSizes = (size: string) => {
    switch (size) {
      case 'xs': return '24px';
      case 'sm': return '32px';
      case 'md': return '40px';
      case 'lg': return '48px';
      case 'xl': return '64px';
      default: return '40px';
    }
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
          sizes={getSizes(size)}
          onError={handleImageError}
          quality={60}
          priority={false}
        />
      ) : (
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
});

Avatar.displayName = 'Avatar';

export default Avatar;
import React, { memo, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Heart, Bookmark, Eye, User, Star, Play } from 'lucide-react';
import LazyImage from './LazyImage';
import VideoPlayer from './VideoPlayer';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useOptimizedCache, generateCacheKey } from '../../lib/cache';
import { getOptimizedImageProps } from '../../lib/image-optimization';

interface OptimizedPromptCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  mediaType?: 'image' | 'video';
  category: string;
  tags: string[];
  username: string;
  userId: string;
  userAvatarUrl: string;
  createdAt: string;
  likes: number;
  bookmarks: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  pricing?: {
    type: 'free' | 'paid';
    amount?: number;
  };
  onLike?: (promptId: string) => Promise<void>;
  onBookmark?: (promptId: string) => Promise<void>;
  onFollow?: (userId: string) => Promise<void>;
  showUserActions?: boolean;
  className?: string;
  index?: number;
  customThumbnail?: React.ReactNode;
}

// グローバルトースト用のイベント名
const GLOBAL_TOAST_EVENT = 'global:toast:show';

// グローバルトースト表示関数
export const showGlobalToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  const event = new CustomEvent(GLOBAL_TOAST_EVENT, {
    detail: { title, description, variant }
  });
  window.dispatchEvent(event);
};

const OptimizedPromptCard: React.FC<OptimizedPromptCardProps> = memo(({
  id,
  title,
  description,
  thumbnailUrl,
  mediaType = 'image',
  category,
  tags,
  username,
  userId,
  userAvatarUrl,
  createdAt,
  likes,
  bookmarks,
  views,
  isLiked,
  isBookmarked,
  isFollowing,
  pricing,
  onLike,
  onBookmark,
  onFollow,
  showUserActions = true,
  className = '',
  index = 0,
  customThumbnail
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const cache = useOptimizedCache();

  // キャッシュキーの生成
  const imageKey = useMemo(() => 
    generateCacheKey('prompt-thumb', id, thumbnailUrl),
    [id, thumbnailUrl]
  );

  const metadataKey = useMemo(() => 
    generateCacheKey('prompt-meta', id, createdAt),
    [id, createdAt]
  );

  // 画像最適化設定
  const imageProps = useMemo(() => 
    getOptimizedImageProps('thumbnail', index),
    [index]
  );

  // フォーマット済み日付のメモ化
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(createdAt), 'M月d日', { locale: ja });
    } catch {
      return '';
    }
  }, [createdAt]);

  // メタデータのキャッシュ
  useMemo(() => {
    if (cache) {
      const metadata = { likes, bookmarks, views, formattedDate };
      cache.cacheMetadata(metadataKey, metadata);
    }
  }, [cache, metadataKey, likes, bookmarks, views, formattedDate]);

  // アクションハンドラーの最適化
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onLike || actionLoading) return;
    
    setActionLoading('like');
    try {
      await onLike(id);
    } finally {
      setActionLoading(null);
    }
  }, [onLike, id, actionLoading]);

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onBookmark || actionLoading) return;
    
    setActionLoading('bookmark');
    try {
      await onBookmark(id);
    } finally {
      setActionLoading(null);
    }
  }, [onBookmark, id, actionLoading]);

  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onFollow || actionLoading) return;
    
    setActionLoading('follow');
    try {
      await onFollow(userId);
    } finally {
      setActionLoading(null);
    }
  }, [onFollow, userId, actionLoading]);

  // サムネイル表示の最適化
  const thumbnailElement = useMemo(() => {
    if (customThumbnail) {
      return customThumbnail;
    }

    if (!thumbnailUrl) {
      return (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <Star className="h-12 w-12 text-gray-300" />
        </div>
      );
    }

    // キャッシュから確認
    const cachedUrl = cache?.getImageUrl(imageKey);
    const finalUrl = cachedUrl || thumbnailUrl;

    if (mediaType === 'video') {
      return (
        <VideoPlayer
          src={finalUrl}
          alt={title}
          className="w-full h-48"
          hoverToPlay={false}
          tapToPlay={false}
          muted={true}
          loop={false}
          showThumbnail={true}
          minimumOverlay={true}
        />
      );
    }

    return (
      <LazyImage
        src={finalUrl}
        alt={title}
        className="w-full h-48"
        loading={imageProps.loading}
        priority={imageProps.priority}
        sizes={imageProps.sizes}
        onLoad={() => {
          setImageLoaded(true);
          if (cache && !cachedUrl) {
            cache.cacheImageUrl(imageKey, thumbnailUrl);
          }
        }}
      />
    );
  }, [customThumbnail, thumbnailUrl, mediaType, title, cache, imageKey, imageProps]);

  // タグ表示の最適化（最大3つまで）
  const displayTags = useMemo(() => tags.slice(0, 3), [tags]);

  // 価格表示の最適化
  const priceDisplay = useMemo(() => {
    if (!pricing || pricing.type === 'free') {
      return <Badge variant="secondary">無料</Badge>;
    }
    return (
      <Badge variant="default">
        ¥{pricing.amount?.toLocaleString() || 0}
      </Badge>
    );
  }, [pricing]);

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-300 group',
      className
    )}>
      <Link href={`/prompts/${id}`} className="block">
        {/* サムネイル */}
        <div className="relative overflow-hidden bg-gray-50">
          {thumbnailElement}
          
          {/* 動画インジケーター */}
          {mediaType === 'video' && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Play className="h-3 w-3" />
              動画
            </div>
          )}
          
          {/* 価格表示 */}
          <div className="absolute top-2 right-2">
            {priceDisplay}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-3">
          {/* タイトル */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-5">
            {title}
          </h3>

          {/* 説明文 */}
          {description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-4">
              {description}
            </p>
          )}

          {/* タグ */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* ユーザー情報 */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {userAvatarUrl ? (
              <img 
                src={userAvatarUrl} 
                alt={username}
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="truncate font-medium">{username}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          {/* 統計情報 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className={cn("h-3 w-3", isLiked && "text-red-500 fill-current")} />
                {likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className={cn("h-3 w-3", isBookmarked && "text-blue-500 fill-current")} />
                {bookmarks.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* アクションボタン */}
      {showUserActions && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!!actionLoading}
            className={cn(
              "flex-1 h-8 text-xs",
              isLiked && "text-red-500"
            )}
          >
            <Heart className={cn("h-3 w-3 mr-1", isLiked && "fill-current")} />
            {actionLoading === 'like' ? '...' : 'いいね'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={!!actionLoading}
            className={cn(
              "flex-1 h-8 text-xs",
              isBookmarked && "text-blue-500"
            )}
          >
            <Bookmark className={cn("h-3 w-3 mr-1", isBookmarked && "fill-current")} />
            {actionLoading === 'bookmark' ? '...' : '保存'}
          </Button>

          {!isFollowing && onFollow && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFollow}
              disabled={!!actionLoading}
              className="flex-1 h-8 text-xs"
            >
              {actionLoading === 'follow' ? '...' : 'フォロー'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

OptimizedPromptCard.displayName = 'OptimizedPromptCard';

export default OptimizedPromptCard; 
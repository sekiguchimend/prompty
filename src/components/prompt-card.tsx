import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Heart, Bookmark, Clock, User, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../hooks/use-toast';
import Image from 'next/image';
import { PromptItem } from '../pages/prompts/[id]';
import { likePrompt, unlikePrompt, checkIfLiked } from '../lib/like-service';
import { bookmarkPrompt, unbookmarkPrompt, checkIfBookmarked } from '../lib/bookmark-service';
import { useAuth } from '../lib/auth-context';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import VideoPlayer from './common/VideoPlayer';
import LazyImage from './common/LazyImage';
import { useOptimizedCache, generateCacheKey } from '../lib/cache';
import { getOptimizedImageProps } from '../lib/image-optimization';

interface PromptCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  mediaType?: 'image' | 'video';
  user: {
    name: string;
    account_name?: string;
    avatarUrl: string;
  };
  postedAt: string;
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  category?: string;
  tags?: string[];
  onHide?: (id: string) => void;
  isLastItem?: boolean;
  index?: number;
  showActions?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = memo(({
  id,
  title,
  description,
  thumbnailUrl,
  mediaType = 'image',
  user,
  postedAt,
  likeCount,
  isLiked = false,
  isBookmarked = false,
  category,
  tags = [],
  onHide,
  isLastItem,
  index = 0,
  showActions = true
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  const cache = useOptimizedCache();

  // キャッシュキーの生成
  const imageKey = useMemo(() => 
    generateCacheKey('prompt-card', id, thumbnailUrl),
    [id, thumbnailUrl]
  );

  // 画像最適化設定
  const imageProps = useMemo(() => 
    getOptimizedImageProps('thumbnail', index),
    [index]
  );

  // 状態チェック（最適化）
  useEffect(() => {
    if (!currentUser || isLoading) return;
    
    const checkStatuses = async () => {
      try {
        const [likedStatus, bookmarkedStatus] = await Promise.all([
          checkIfLiked(id, currentUser.id),
          checkIfBookmarked(id, currentUser.id)
        ]);
        
        setLiked(likedStatus);
        setBookmarked(bookmarkedStatus);
      } catch (error) {
        console.error('状態取得エラー:', error);
      }
    };

    checkStatuses();
  }, [id, currentUser?.id, isLoading]);

  // いいねハンドラー（最適化）
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser || actionLoading) return;
    
    setActionLoading('like');
    try {
      if (liked) {
        await unlikePrompt(id, currentUser.id);
        setLiked(false);
        setCurrentLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await likePrompt(id, currentUser.id);
        setLiked(true);
        setCurrentLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('いいね処理エラー:', error);
      toast({
        title: "エラー",
        description: "処理に失敗しました",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [liked, currentUser, id, actionLoading, toast]);

  // ブックマークハンドラー（最適化）
  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser || actionLoading) return;
    
    setActionLoading('bookmark');
    try {
      if (bookmarked) {
        await unbookmarkPrompt(id, currentUser.id);
        setBookmarked(false);
      } else {
        await bookmarkPrompt(id, currentUser.id);
        setBookmarked(true);
      }
    } catch (error) {
      console.error('ブックマーク処理エラー:', error);
      toast({
        title: "エラー",
        description: "処理に失敗しました",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  }, [bookmarked, currentUser, id, actionLoading, toast]);

  // サムネイル表示の最適化
  const thumbnailElement = useMemo(() => {
    if (!thumbnailUrl) {
      return (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400">画像なし</div>
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
          hoverToPlay={true}
          tapToPlay={true}
          muted={true}
          loop={true}
          showThumbnail={true}
          minimumOverlay={false}
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
          if (cache && !cachedUrl) {
            cache.cacheImageUrl(imageKey, thumbnailUrl);
          }
        }}
      />
    );
  }, [thumbnailUrl, mediaType, title, cache, imageKey, imageProps]);

  // タグ表示の最適化
  const displayTags = useMemo(() => tags.slice(0, 3), [tags]);

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md group',
      !isLastItem && 'mb-4'
    )}>
      <Link href={`/prompts/${id}`} className="block">
        {/* サムネイル */}
        <div className="relative">
          {thumbnailElement}
          
          {/* カテゴリー */}
          {category && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {category}
              </Badge>
            </div>
          )}
          
          {/* 動画バッジ */}
          {mediaType === 'video' && (
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="text-xs bg-black bg-opacity-70 text-white border-none">
                動画
              </Badge>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-3">
          {/* タイトル */}
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm leading-5">
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
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="truncate font-medium">{user.name}</span>
            <span>•</span>
            <span>{postedAt}</span>
          </div>
        </div>
      </Link>

      {/* アクションボタン */}
      {showActions && (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!!actionLoading || !currentUser}
            className={cn(
              "flex-1 h-8 text-xs",
              liked && "text-red-500"
            )}
          >
            <Heart className={cn("h-3 w-3 mr-1", liked && "fill-current")} />
            {actionLoading === 'like' ? '...' : currentLikeCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={!!actionLoading || !currentUser}
            className={cn(
              "flex-1 h-8 text-xs",
              bookmarked && "text-blue-500"
            )}
          >
            <Bookmark className={cn("h-3 w-3 mr-1", bookmarked && "fill-current")} />
            {actionLoading === 'bookmark' ? '...' : '保存'}
          </Button>
        </div>
      )}
    </div>
  );
});

PromptCard.displayName = 'PromptCard';

export default PromptCard;

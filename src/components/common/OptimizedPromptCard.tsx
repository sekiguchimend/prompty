import React, { memo, useState, useEffect, useContext, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '../../hooks/use-toast';
import { PromptItem } from '../../pages/prompts/[id]';
import { likePrompt, unlikePrompt, checkIfLiked } from '../../lib/like-service';
import { bookmarkPrompt, unbookmarkPrompt, checkIfBookmarked } from '../../lib/bookmark-service';
import { useAuth } from '../../lib/auth-context';
import { HeartIcon, BookmarkIcon, DotsVerticalIcon } from '../ui/icons';
import LazyImage from './LazyImage';
import VideoPlayer from './VideoPlayer';
import { Avatar } from '../shared/Avatar';
import { getDisplayName } from '../../lib/avatar-utils';
import ReportDialog from '../shared/ReportDialog';
import { notoSansJP } from '../../lib/fonts';
import { storageService } from '../../lib/storage-service';
import { useResponsive } from '../../hooks/use-responsive';

interface OptimizedPromptCardProps {
  id: string;
  title: string;
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
  onHide?: (id: string) => void;
  isFeatureSection?: boolean;
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

// 最適化: 重複したリサイズリスナーを削除し、統合フックを使用

const OptimizedPromptCard: React.FC<OptimizedPromptCardProps> = memo(({
  id,
  title,
  thumbnailUrl,
  mediaType = 'image',
  user,
  postedAt,
  likeCount,
  isLiked = false,
  isBookmarked = false,
  onHide,
  isFeatureSection = false,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [isBookmarkProcessing, setIsBookmarkProcessing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { isMobile } = useResponsive(); // 最適化: 統合レスポンシブフック使用
  
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  
  // 初期表示時に非表示チェック（最適化: 統合サービス使用）
  useEffect(() => {
    setIsHidden(storageService.isPostHidden(id));
  }, [id]);
  
  // いいね状態を取得（最適化: debounce + memoization）
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const checkStatuses = async () => {
      if (!currentUser || isLoading) return;
      
      try {
        // 並列実行で高速化
        const [likedStatus, bookmarkedStatus] = await Promise.all([
          checkIfLiked(id, currentUser.id),
          checkIfBookmarked(id, currentUser.id)
        ]);
        
        if (isMounted) {
          setLiked(likedStatus);
          setBookmarked(bookmarkedStatus);
        }
      } catch (error) {
        console.error('状態の取得に失敗しました:', error);
      }
    };
    
    // debounce処理で頻繁な呼び出しを抑制
    timeoutId = setTimeout(checkStatuses, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [id, currentUser?.id, isLoading]); // currentUser.idのみに依存

  const toggleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      showGlobalToast('ログインが必要です', 'いいねをするにはログインしてください', 'destructive');
      return;
    }
    
    if (isLikeProcessing) return;
    
    setIsLikeProcessing(true);
    
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
      console.error('いいね処理中にエラーが発生しました:', error);
      showGlobalToast('エラー', 'いいねの処理に失敗しました', 'destructive');
    } finally {
      setIsLikeProcessing(false);
    }
  }, [liked, currentUser, id, isLikeProcessing]);

  const toggleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      showGlobalToast('ログインが必要です', 'ブックマークするにはログインしてください', 'destructive');
      return;
    }
    
    if (isBookmarkProcessing) return;
    
    setIsBookmarkProcessing(true);
    
    try {
      if (bookmarked) {
        await unbookmarkPrompt(id, currentUser.id);
        setBookmarked(false);
        showGlobalToast('ブックマーク解除', 'ブックマークを解除しました');
      } else {
        await bookmarkPrompt(id, currentUser.id);
        setBookmarked(true);
        showGlobalToast('ブックマーク追加', 'ブックマークに追加しました');
      }
    } catch (error) {
      console.error('ブックマーク処理中にエラーが発生しました:', error);
      showGlobalToast('エラー', 'ブックマークの処理に失敗しました', 'destructive');
    } finally {
      setIsBookmarkProcessing(false);
    }
  }, [bookmarked, currentUser, id, isBookmarkProcessing]);

  const handleHide = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // 最適化: 統合サービス使用
      storageService.addHiddenPost(id);
      
      setIsHidden(true);
      if (onHide) {
        onHide(id);
      }
      
      showGlobalToast('投稿を非表示にしました', '一覧から削除されました');
    } catch (error) {
      console.error('投稿の非表示に失敗しました:', error);
      showGlobalToast('エラー', '投稿の非表示に失敗しました', 'destructive');
    }
  }, [id, onHide]);

  const openReportDialog = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setReportDialogOpen(true);
    setShowOptions(false);
  }, []);

  if (isHidden) {
    return null;
  }

  return (
    <>
      <Link 
        href={`/prompts/${id}`} 
        className="block group/card hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
      >
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 flex flex-col">
          {/* サムネイル */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {mediaType === 'video' ? (
              <VideoPlayer
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-200"
                hoverToPlay={true}
                tapToPlay={true}
                muted={true}
                loop={true}
                showThumbnail={true}
                onLinkClick={() => {
                  // プログラム的にナビゲーション
                  window.location.href = `/prompts/${id}`;
                }}
              />
            ) : (
              <LazyImage
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-200"
                fallbackSrc="/images/default-thumbnail.svg"
                priority={isFeatureSection}
              />
            )}
          </div>
          
          {/* コンテンツ */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className={`text-sm font-medium text-gray-900 line-clamp-2 mb-3 flex-1 leading-relaxed ${notoSansJP.className}`}>
              {title}
            </h3>
            
            {/* ユーザー情報 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Avatar
                  src={user.avatarUrl}
                  displayName={user.name}
                  size="sm"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 truncate">
                    {getDisplayName(user.name)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{postedAt}</p>
            </div>
            
            <div className="mt-2">
              {/* アクションボタン */}
              <div className="flex items-center space-x-2 justify-end">
                <button
                  onClick={toggleLike}
                  disabled={isLikeProcessing}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                    liked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } ${isLikeProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <HeartIcon className={`h-3 w-3 ${liked ? 'fill-current' : ''}`} />
                  <span>{currentLikeCount}</span>
                </button>
                
                <button
                  onClick={toggleBookmark}
                  disabled={isBookmarkProcessing}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    bookmarked 
                      ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  } ${isBookmarkProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <BookmarkIcon className={`h-3 w-3 ${bookmarked ? 'fill-current' : ''}`} />
                </button>
                
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOptions(!showOptions);
                    }}
                    className="p-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <DotsVerticalIcon className="h-3 w-3" />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 top-8 mt-1 w-32 bg-white rounded-md shadow-lg border z-10">
                      <button
                        onClick={handleHide}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-t-md"
                      >
                        非表示にする
                      </button>
                      <button
                        onClick={openReportDialog}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-b-md"
                      >
                        報告する
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetId={id}
        targetType="prompt"
      />
    </>
  );
});

OptimizedPromptCard.displayName = 'OptimizedPromptCard';

export default OptimizedPromptCard; 
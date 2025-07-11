import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, memo } from 'react';
import { Heart, Bookmark, BookmarkPlus, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../hooks/use-toast';
import Image from 'next/image';
import { PromptItem } from '../pages/prompts/[id]';
import { likePrompt, unlikePrompt } from '../lib/like-service';
import { bookmarkPrompt, unbookmarkPrompt } from '../lib/bookmark-service';
import { useAuth } from '../lib/auth-context';
import { checkIfLiked } from '../lib/like-service';
import { checkIfBookmarked } from '../lib/bookmark-service';
import ReportDialog from './shared/ReportDialog';
import { notoSansJP } from '../lib/fonts';
import { UnifiedAvatar, DEFAULT_AVATAR_URL } from './index';
import VideoPlayer from './common/VideoPlayer';
import { useResponsive } from '../hooks/use-responsive';
import { storageService } from '../lib/storage-service';
import { getOptimizedImageProps, useImageState, DEFAULT_BLUR_DATA_URL } from '../lib/image-optimization';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import OptimizedPromptCard from './common/OptimizedPromptCard';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { useOptimizedCache, generateCacheKey } from '../lib/cache';

// グローバルトースト用のイベント名
const GLOBAL_TOAST_EVENT = 'global:toast:show';

// グローバルトースト表示関数
export const showGlobalToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  // カスタムイベントを発行
  const event = new CustomEvent(GLOBAL_TOAST_EVENT, {
    detail: { title, description, variant }
  });
  window.dispatchEvent(event);
};

// PromptGrid.tsx用のコンポーネント
export type { PromptItem };

interface PromptCardProps {
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
  isLastItem?: boolean;
}

// メニュー開閉を管理するためのカスタムイベント名
const DROPDOWN_TOGGLE_EVENT = 'promptcard:dropdown:toggle';

// 非表示チェック用の関数（最適化: 統合サービス使用）
function isPostHidden(id: string): boolean {
  return storageService.isPostHidden(id);
}

// 簡易トースト通知コンポーネント
const GlobalToast: React.FC = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState({ 
    title: '', 
    description: '', 
    variant: 'default' as 'default' | 'destructive' 
  });

  useEffect(() => {
    const handleGlobalToast = (e: CustomEvent) => {
      const { title, description, variant } = e.detail;
      setMessage({ title, description, variant });
      setShow(true);
      
      // 3秒後に非表示
      setTimeout(() => {
        setShow(false);
      }, 3000);
    };
    
    // イベントリスナーを登録
    window.addEventListener(GLOBAL_TOAST_EVENT, handleGlobalToast as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener(GLOBAL_TOAST_EVENT, handleGlobalToast as EventListener);
    };
  }, []);

  if (!show) return null;
  
  return (
    <div 
      className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg transition-opacity duration-300 ${
        message.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
      }`}
      style={{
        zIndex: 9999,
        maxWidth: '300px',
        opacity: show ? 1 : 0
      }}
    >
      <div className="font-bold mb-1">{message.title}</div>
      <div className="text-sm">{message.description}</div>
    </div>
  );
};

// 最適化: 重複したリサイズリスナーを削除し、統合フックを使用

// FeatureSectionContextを追加
const FeatureSectionContext = createContext<boolean>(false);

// 安全な画像URLを取得する関数
const getSafeImageUrl = (url: string): string => {
  // デフォルト画像のURL
  const defaultImage = '/images/default-thumbnail.svg';
  
  // URLがない場合はデフォルト画像を返す
  if (!url || url.trim() === '') return defaultImage;
  
  // プロトコル相対URL（//で始まる）の場合はhttpsを追加
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // ローカルの画像の場合はそのまま返す
  if (url.startsWith('/')) return url;
  
  // 完全なURLの場合はそのまま返す
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // その他の場合はデフォルト画像を返す
  return defaultImage;
};

// PromptCardコンポーネントをReact.memoで最適化
const PromptCard: React.FC<PromptCardProps> = memo(({
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
  isLastItem,
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
  const isFeatureSection = useContext(FeatureSectionContext);
  
  // URLがない場合のプレースホルダー
  const defaultThumbnail = '/images/default-thumbnail.svg';
  
  // 常に安全なURLを使用（Supabaseのエラー回避）
  const imageUrl = getSafeImageUrl(thumbnailUrl);
  
  // 統合画像状態管理
  const { isLoading: imageLoading, hasError: imageError, handleLoad: handleImageLoad, handleError: handleImageError } = useImageState();
  
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  
  // IDはそのまま使う
  const promptId = id;
  
  // LCP改善：最初の4枚の画像は優先読み込み
  const isEarlyImage = useMemo(() => {
    // PromptGridで管理されるインデックスがないため、IDベースで判定
    // 実際の実装では、PromptGridからindexを渡すことを推奨
    return true; // 全ての画像を優先読み込みとして扱う（後で調整可能）
  }, []);
  
  // 初期表示時に非表示チェック（最適化: 統合サービス使用）
  useEffect(() => {
    setIsHidden(storageService.isPostHidden(id));
  }, [id]);
  
  // コンポーネントマウント時にサーバーからいいね状態を取得
  useEffect(() => {
    const checkLikeStatus = async () => {
      // 未ログインの場合はチェックしない
      if (!currentUser || isLoading) return;
      
      try {
        // Supabaseからいいねの状態を取得 (importしたcheckIfLikedを使います)
        const isLikedByUser = await checkIfLiked(promptId, currentUser.id);
        
        // サーバーから取得した状態と現在の状態が異なる場合は更新
        if (isLikedByUser !== liked) {
          setLiked(isLikedByUser);
        }
      } catch (error) {
        console.error('いいね状態確認エラー:', error);
      }
    };
    
    checkLikeStatus();
  }, [promptId, currentUser, isLoading]);

  // コンポーネントマウント時にサーバーからブックマーク状態を取得
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      // 未ログインの場合はチェックしない
      if (!currentUser || isLoading) return;
      
      try {
        // Supabaseからブックマークの状態を取得
        const isBookmarkedByUser = await checkIfBookmarked(promptId, currentUser.id);
        
        // サーバーから取得した状態と現在の状態が異なる場合は更新
        if (isBookmarkedByUser !== bookmarked) {
          setBookmarked(isBookmarkedByUser);
        }
      } catch (error) {
        console.error('ブックマーク状態確認エラー:', error);
      }
    };
    
    checkBookmarkStatus();
  }, [promptId, currentUser, isLoading]);
  
  // 他のカードのドロップダウンイベントをリッスン
  useEffect(() => {
    const handleOtherDropdownToggle = (e: CustomEvent) => {
      // イベントの送信元が自分自身でない場合のみ処理
      if (e.detail && e.detail.cardId !== id) {
        // 他のカードがドロップダウンを開いたので、このカードのドロップダウンを閉じる
        setShowOptions(false);
      }
    };
    
    // カスタムイベントをリッスン
    window.addEventListener(DROPDOWN_TOGGLE_EVENT, handleOtherDropdownToggle as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener(DROPDOWN_TOGGLE_EVENT, handleOtherDropdownToggle as EventListener);
    };
  }, [id]);
  
  // toggleLike関数をuseCallbackで最適化
  const toggleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLikeProcessing) return;
    if (isLoading || !currentUser) {
      showGlobalToast('ログインが必要です', 'いいねするにはログインしてください', 'destructive');
      return;
    }
    
    setIsLikeProcessing(true);
    
    try {
      if (liked) {
        const result = await unlikePrompt(promptId, currentUser.id);
        if (result.success) {
          setLiked(false);
          setCurrentLikeCount(prev => Math.max(0, prev - 1));
          showGlobalToast('いいねを解除しました', '');
        }
      } else {
        const result = await likePrompt(promptId, currentUser.id);
        if (result.success) {
          setLiked(true);
          setCurrentLikeCount(prev => prev + 1);
          showGlobalToast('いいねしました', '');
        }
      }
    } catch (error) {
      console.error('いいね操作エラー:', error);
      showGlobalToast('エラーが発生しました', '時間をおいて再度お試しください', 'destructive');
    } finally {
      setIsLikeProcessing(false);
    }
  }, [isLikeProcessing, isLoading, currentUser, liked, promptId]);

  // toggleBookmark関数をuseCallbackで最適化
  const toggleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBookmarkProcessing) return;
    if (isLoading || !currentUser) {
      showGlobalToast('ログインが必要です', 'ブックマークするにはログインしてください', 'destructive');
      return;
    }
    
    setIsBookmarkProcessing(true);
    
    try {
      if (bookmarked) {
        const result = await unbookmarkPrompt(promptId, currentUser.id);
        if (result.success) {
          setBookmarked(false);
          showGlobalToast('ブックマークを解除しました', '');
        }
      } else {
        const result = await bookmarkPrompt(promptId, currentUser.id);
        if (result.success) {
          setBookmarked(true);
          showGlobalToast('ブックマークしました', '');
        }
      }
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
      showGlobalToast('エラーが発生しました', '時間をおいて再度お試しください', 'destructive');
    } finally {
      setIsBookmarkProcessing(false);
    }
  }, [isBookmarkProcessing, isLoading, currentUser, bookmarked, promptId]);
  
  // toggleOptions関数をuseCallbackで最適化
  const toggleOptions = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 他のドロップダウンを閉じるイベントを発行
    const event = new CustomEvent(DROPDOWN_TOGGLE_EVENT, { detail: { currentId: promptId } });
    window.dispatchEvent(event);
    
    setShowOptions(!showOptions);
  }, [promptId, showOptions]);
  
  // 非表示にする関数
  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 統合サービスで保存
    try {
      storageService.addHiddenPost(id);
      setIsHidden(true);
    } catch (error) {
      console.error('非表示設定の保存に失敗しました', error);
    }
    
    if (onHide) {
      onHide(id);
    } else {
      // グローバルトースト表示
      showGlobalToast(
        "投稿を非表示にしました", 
        "このコンテンツは今後表示されません"
      );
    }
  };
  
  // 報告ダイアログを開く関数
  const openReportDialog = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowOptions(false);
    setReportDialogOpen(true);
  };
  
  // ダイアログを閉じた時に状態をリセット
  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
  };
  
  // 非表示なら何も表示しない
  if (isHidden) {
    return null;
  }
  
  // モバイル表示用のカードレイアウト（横並びの簡素版）
  if (isMobile && !isFeatureSection) {
    return (
      <div className={`py-3 flex ${!isLastItem ? 'border-b border-gray-200' : ''}`}>
        {/* カード左側：テキスト情報 */}
        <div className="flex-1 pr-3">
                  <h3 className="text-base font-bold line-clamp-2 mb-2">
          <Link href={`/prompts/${id}`} passHref legacyBehavior prefetch={false}>
            <a className="cursor-pointer hover:text-blue-600">{title}</a>
          </Link>
        </h3>
          
          <div className="flex items-center text-xs text-gray-500">
            {/* ユーザー情報 */}
            <div className="flex items-center mr-3">
              <UnifiedAvatar
                src={user.avatarUrl}
                displayName={user.name}
                size="xs"
                className="mr-1"
              />
              <span className="truncate">{user.name}</span>
            </div>
            
            {/* 投稿日時 */}
            <span className="mr-3">{postedAt}</span>
            
            {/* いいね数 */}
            <div className="flex items-center">
              <Heart className={`w-3.5 h-3.5 mr-0.5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              <span>{currentLikeCount}</span>
            </div>
          </div>
        </div>
        
        {/* カード右側：サムネイル画像/動画 */}
        <div className="w-24 h-16 flex-shrink-0">
          <Link href={`/prompts/${id}`} passHref legacyBehavior prefetch={false}>
            <div className="w-full h-full rounded overflow-hidden relative">
              {mediaType === 'video' ? (
                <VideoPlayer
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full"
                  hoverToPlay={false} // モバイルでは自動再生無効
                  tapToPlay={false}
                  muted={true}
                  loop={false}
                  showThumbnail={true}
                  minimumOverlay={true} // カテゴリー投稿では再生ボタンのみ表示
                  onLinkClick={() => {
                    window.location.href = `/prompts/${id}`;
                  }}
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  quality={65}
                  sizes="96px"
                  placeholder="blur"
                  blurDataURL={DEFAULT_BLUR_DATA_URL}
                  onLoad={handleImageLoad}
                  onError={(e) => handleImageError(e, 'thumbnail')}
                />
              )}
              {/* モバイル用動画バッジ */}
              {mediaType === 'video' && (
                <div className="absolute top-1 right-1 z-10">
                  <span className="bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
                    動画
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    );
  }
  
  // 通常のカードレイアウト（PC表示および「今日の注目記事」セクション）
  return (
    <div className="relative group">
      <div className="cursor-pointer bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-200 h-full overflow-hidden flex flex-col">
        <div className="relative pt-[56.25%] bg-gray-50">
          <Link href={`/prompts/${id}`} passHref legacyBehavior prefetch={false}>
            <div className="absolute inset-0">
              {mediaType === 'video' ? (
                <VideoPlayer
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full"
                  hoverToPlay={true}
                  tapToPlay={true}
                  muted={true}
                  loop={true}
                  showThumbnail={true}
                  onLinkClick={() => {
                    window.location.href = `/prompts/${id}`;
                  }}
                />
              ) : (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  {...getOptimizedImageProps('thumbnail')}
                  onLoad={handleImageLoad}
                  onError={(e) => handleImageError(e, 'thumbnail')}
                />
              )}
              {/* 動画バッジ */}
              {mediaType === 'video' && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    動画
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex flex-col p-2 flex-1">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/prompts/${id}`} passHref legacyBehavior prefetch={false}>
              <a className="flex-1 mr-2">
                <div 
                  className={`line-clamp-2 text-gray-700 hover:text-prompty-primary h-12 overflow-hidden cursor-pointer ${notoSansJP.className}`} 
                  style={{ 
                    fontWeight: 700,
                    contentVisibility: 'auto',
                    containIntrinsicSize: '200px 48px'
                  }}
                >
                  {title}
                </div>
              </a>
            </Link>
            
            {/* 三点メニュー */}
            <div className="relative">
              <button 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                onClick={toggleOptions}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 bottom-full mb-1 bg-white shadow-lg rounded-md border border-gray-200 py-1 z-10 w-32">
                  <button 
                    className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={handleHide}
                  >
                    非表示にする
                  </button>
                  <button
                    className="w-full text-left px-3 py-1 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openReportDialog();
                    }}
                  >
                    報告する
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <UnifiedAvatar
                  src={user.avatarUrl}
                  displayName={user.account_name || user.name}
                  size="xs"
                  className="flex-shrink-0"
                />
                <span className="text-xs text-gray-600 truncate flex-1 min-w-0">
                  {user.account_name || user.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{postedAt}</span>
            </div>
            <div className="flex items-center mt-3">
              <div className="flex items-center text-gray-500">
                <button 
                  className={`like-button flex items-center ${liked ? 'text-pink-500' : 'text-gray-400'}`}
                  onClick={toggleLike}
                >
                  <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-pink-500' : ''}`} />
                </button>
                <span className="text-xs">{currentLikeCount}</span>
              </div>
              <div className="flex items-center text-gray-500 ml-2">
                <button 
                  className={`bookmark-button flex items-center ${bookmarked ? 'text-blue-300' : 'text-gray-500'}`}
                  onClick={toggleBookmark}
                >
                  <BookmarkPlus className={`mr-1 h-4 w-4 ${bookmarked ? 'fill-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 報告ダイアログ */}
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={handleCloseReportDialog}
        targetId={promptId}
        promptId={promptId}
        targetType="prompt"
      />
    </div>
  );
});

PromptCard.displayName = 'PromptCard';

// PromptGridコンポーネント
interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
  categoryPath?: string;  // カテゴリパスを追加（すべてを見るカードのリンク先）
  showViewAll?: boolean;  // すべてを見るカードを表示するかどうか
  isFeatureSection?: boolean; // 「今日の注目記事」セクションかどうか
}

const PromptGrid: React.FC<PromptGridProps> = memo(({ 
  prompts, 
  sectionPrefix = '',
  horizontalScroll = false,
  categoryPath = '',
  showViewAll = true, // デフォルトは表示する
  isFeatureSection = false // デフォルトは「今日の注目記事」セクションではない
}) => {
  // 非表示の投稿を管理するための状態
  const [hiddenPromptIds, setHiddenPromptIds] = useState<string[]>([]);
  const { isMobile } = useResponsive(); // 最適化: 統合レスポンシブフック使用
  const scrollContainerRef = React.useRef<HTMLDivElement>(null); // スクロールコンテナへの参照を追加
  const [canScrollLeft, setCanScrollLeft] = useState(false); // 左スクロール可能かどうか
  const [canScrollRight, setCanScrollRight] = useState(false); // 右スクロール可能かどうか
  
  // 画面に表示されたときに読み込むための参照
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // インターセクションオブザーバーを使用して、コンポーネントが表示されたときにisVisibleをtrueに設定
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // 一度表示されたら監視を停止
          if (gridRef.current) observer.unobserve(gridRef.current);
        }
      },
      { threshold: 0.1 }
    );
    
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }
    
    return () => {
      if (gridRef.current) observer.unobserve(gridRef.current);
    };
  }, []);

  // スクロール可能状態をチェック - useCallbackで最適化
  const checkScrollability = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // 左にスクロール可能か判定（現在のスクロール位置が0より大きいか）
      setCanScrollLeft(container.scrollLeft > 0);
      // 右にスクロール可能か判定（残りのスクロール量が存在するか）
      setCanScrollRight(
        container.scrollWidth > container.clientWidth &&
        container.scrollLeft < (container.scrollWidth - container.clientWidth - 10) // 10pxの余裕を持たせる
      );
    }
  }, []);

  // 初期表示時に非表示リストを読み込む（最適化: 統合サービス使用）
  useEffect(() => {
    setHiddenPromptIds(storageService.getHiddenPosts());
  }, []);

  // 初期表示時にスクロール可能性をチェック（最適化: windowリサイズイベントは不要）
  useEffect(() => {
    if (horizontalScroll) {
      checkScrollability();
    }
  }, [horizontalScroll, checkScrollability]);
  
  // 横スクロールを処理する関数 - useCallbackで最適化
  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 200; // カードの横幅
      const scrollAmount = cardWidth * 3; // 3カード分の幅

      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
      
      // スクロール後にスクロール可能状態を更新するため少し遅延させる
      setTimeout(checkScrollability, 400);
    }
  }, [checkScrollability]);
  
  // スクロールイベントのリスナーを追加
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && horizontalScroll) {
      const handleScrollEvent = () => {
        checkScrollability();
      };
      
      container.addEventListener('scroll', handleScrollEvent);
      return () => {
        container.removeEventListener('scroll', handleScrollEvent);
      };
    }
  }, [horizontalScroll, checkScrollability]);

  // 非表示処理の関数（最適化: 統合サービス使用）
  const handleHidePrompt = useCallback((id: string) => {
    try {
      storageService.addHiddenPost(id);
      // ステートを更新して再レンダリングを発生させる
      setHiddenPromptIds(storageService.getHiddenPosts());
    } catch (error) {
      console.error('非表示処理に失敗しました', error);
    }
  }, []);

  // 計算処理をuseMemoで最適化
  const memoizedData = useMemo(() => {
    // 非表示の投稿を除外したリストを作成
    const visiblePrompts = prompts.filter(prompt => !hiddenPromptIds.includes(prompt.id));
    
    // 表示する最大カード数
    const maxVisibleCards = prompts.length <= 6 ? prompts.length : 9; // 6件以下なら全件、7件以上なら9件に制限
    const limitedPrompts = visiblePrompts.slice(0, maxVisibleCards);
    
    // カテゴリパスがない場合のデフォルトパス
    const viewAllPath = categoryPath || '/prompts';
    
    return {
      visiblePrompts,
      limitedPrompts,
      viewAllPath
    };
  }, [prompts, hiddenPromptIds, categoryPath]);

  // スタイルクラスをuseMemoで最適化
  const styles = useMemo(() => {
    // スマホ表示とPC表示でコンテナクラスを切り分け
    const containerClass = isMobile 
      ? isFeatureSection 
        ? horizontalScroll ? 'flex flex-nowrap overflow-x-auto pb-4 gap-3 snap-x snap-mandatory pr-4 -mr-4 scroll-smooth scrollbar-none w-auto min-w-0' : 'grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4'
        : 'flex flex-col' // 今日の注目記事以外は縦並びのリスト
      : horizontalScroll 
        ? 'flex flex-nowrap overflow-x-auto pb-4 gap-3 snap-x snap-mandatory pr-4 -mr-4 scroll-smooth scrollbar-none w-auto min-w-0'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4 items-stretch';
    
    // カードクラスもスマホ表示用に調整
    const cardClass = isMobile 
      ? isFeatureSection
        ? horizontalScroll ? 'flex-shrink-0 w-[180px] snap-start md:w-[200px]' : ''
        : 'w-full'  // 今日の注目記事以外では幅いっぱい
      : horizontalScroll
        ? 'flex-shrink-0 w-[180px] snap-start md:w-[200px]'
        : '';
    
    // 「すべてを見る」カードのクラス
    const viewAllCardClass = isMobile
      ? isFeatureSection
        ? horizontalScroll ? 'flex-shrink-0 w-[180px] snap-start md:w-[200px]' : ''
        : 'w-full mt-2'  // 今日の注目記事以外では幅いっぱい
      : horizontalScroll
        ? 'flex-shrink-0 w-[180px] snap-start md:w-[200px]'
        : '';

    return { containerClass, cardClass, viewAllCardClass };
  }, [isMobile, isFeatureSection, horizontalScroll]);

  const { visiblePrompts, limitedPrompts, viewAllPath } = memoizedData;
  const { containerClass, cardClass, viewAllCardClass } = styles;
  
  return (
    <FeatureSectionContext.Provider value={isFeatureSection}>
      <div className="relative" ref={gridRef}>
        {/* 横スクロール用の左矢印ボタン - 左にスクロール可能な場合のみ表示 */}
        {horizontalScroll && !isMobile && canScrollLeft && (
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow-xl drop-shadow-md p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleScroll('left')}
            aria-label="左にスクロール"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* 横スクロール用の右矢印ボタン - 右にスクロール可能な場合のみ表示 */}
        {horizontalScroll && !isMobile && canScrollRight && (
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white rounded-full shadow-xl drop-shadow-md p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleScroll('right')}
            aria-label="右にスクロール"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        <div 
          ref={scrollContainerRef} 
          className={containerClass}
          onLoad={checkScrollability} // コンテンツ読み込み完了時にスクロール可能性をチェック
        >
          {limitedPrompts.map((prompt, index) => (
            <div key={`${sectionPrefix}-${prompt.id}`} className={cardClass}>
              <PromptCard
                id={prompt.id}
                title={prompt.title}
                thumbnailUrl={prompt.thumbnailUrl}
                mediaType={prompt.mediaType}
                user={prompt.user}
                postedAt={prompt.postedAt}
                likeCount={prompt.likeCount}
                isLiked={prompt.isLiked}
                isBookmarked={prompt.isBookmarked}
                onHide={() => handleHidePrompt(prompt.id)}
                isLastItem={index === limitedPrompts.length - 1 && (!showViewAll || visiblePrompts.length <= 6)}
              />
            </div>
          ))}
          
          {/* すべてを見るカード（6件より多い場合かつshowViewAllがtrueの場合のみ表示） */}
          {showViewAll && visiblePrompts.length > 6 && (
            <div className={viewAllCardClass}>
              {isMobile && !isFeatureSection ? (
                // スマホ表示で人気記事以外ではボーダー付きテキストリンク（最後なので下線なし）
                <Link href={viewAllPath} className="block py-4 text-center font-bold text-gray-500 hover:underline">
                  <span className="flex items-center justify-center">
                    すべてを見る 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ) : isMobile ? (
                // スマホ表示で人気記事（影ありカード）
                <Link href={viewAllPath} className="block text-center py-4 font-bold text-gray-500 hover:underline">
                  <span className="flex items-center justify-center">
                    すべてを見る 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ) : (
                // PC表示ではカード
                <Link href={viewAllPath} passHref legacyBehavior>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 flex flex-col cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1" data-id="view-all">
                    {/* サムネイル部分（投稿カードと同じアスペクト比） */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* コンテンツ部分（投稿カードと同じ構造） */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className={`text-sm font-medium text-gray-700 text-center mb-3 flex-1 leading-relaxed ${notoSansJP.className}`}>
                        すべてを見る
                      </h3>
                      
                      {/* 空のスペース（投稿カードのユーザー情報と同じ高さ） */}
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-xs text-gray-500">
                          すべての記事を表示
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <GlobalToast />
    </FeatureSectionContext.Provider>
  );
});

PromptGrid.displayName = 'PromptGrid';

export default PromptGrid;
export { GlobalToast };
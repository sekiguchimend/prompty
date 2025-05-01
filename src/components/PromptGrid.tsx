import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, BookmarkPlus, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../hooks/use-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PromptItem } from '../pages/prompts/[id]';
import { likePrompt, unlikePrompt } from '../lib/like-service';
import { bookmarkPrompt, unbookmarkPrompt } from '../lib/bookmark-service';
import { useAuth } from '../lib/auth-context';
import { checkIfLiked } from '../lib/like-service';
import { checkIfBookmarked } from '../lib/bookmark-service';
import ReportDialog from './common/ReportDialog';
import { notoSansJP } from '@/lib/fonts'; // PromptCardと同じインポートパスを使用

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
}

// メニュー開閉を管理するためのカスタムイベント名
const DROPDOWN_TOGGLE_EVENT = 'promptcard:dropdown:toggle';

// 非表示チェック用の関数
function isPostHidden(id: string): boolean {
  try {
    const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
    return Array.isArray(hiddenPosts) && hiddenPosts.includes(id);
  } catch (error) {
    console.error('非表示リストの読み込みに失敗しました', error);
    return false;
  }
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

const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  thumbnailUrl,
  user,
  postedAt,
  likeCount,
  isLiked = false,
  isBookmarked = false,
  onHide,
}) => {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [isBookmarkProcessing, setIsBookmarkProcessing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  
  // IDはそのまま使う
  const promptId = id;
  
  // 初期表示時に非表示チェック
  useEffect(() => {
    try {
      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
      if (Array.isArray(hiddenPosts) && hiddenPosts.includes(id)) {
        setIsHidden(true);
      }
    } catch (error) {
      console.error('非表示リストの読み込みに失敗しました', error);
    }
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
  
  // いいねをトグルする関数
  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 未ログインの場合はログインを促す
    if (!currentUser) {
      // グローバルトースト表示
      showGlobalToast(
        "ログインが必要です", 
        "イイねするにはログインしてください。", 
        "destructive"
      );
      return;
    }
    
    // 同時に複数回処理されないようにする
    if (isLikeProcessing) return;
    
    try {
      setIsLikeProcessing(true);
      
      // いいねの状態を楽観的に更新（UI応答性向上のため）
      setLiked(!liked);
      setCurrentLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
      
      // APIでいいね状態を更新
      if (liked) {
        // いいねを取り消す
        const result = await unlikePrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('いいねの取り消しに失敗しました');
        }
      } else {
        // いいねを追加
        const result = await likePrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('いいねの追加に失敗しました');
        }
      }
    } catch (error) {
      console.error('いいね処理エラー:', error);
      
      // エラーが発生した場合、状態を元に戻す
      setLiked(liked);
      setCurrentLikeCount(prevCount => liked ? prevCount + 1 : prevCount - 1);
      
      // グローバルトースト表示
      showGlobalToast(
        "エラーが発生しました", 
        "操作をやり直してください。", 
        "destructive"
      );
    } finally {
      setIsLikeProcessing(false);
    }
  };

  // ブックマークをトグルする関数
  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 未ログインの場合はログインを促す
    if (!currentUser) {
      // グローバルトースト表示
      showGlobalToast(
        "ログインが必要です", 
        "ブックマークするにはログインしてください。", 
        "destructive"
      );
      return;
    }
    
    // 同時に複数回処理されないようにする
    if (isBookmarkProcessing) return;
    
    try {
      setIsBookmarkProcessing(true);
      
      // ブックマークの状態を楽観的に更新（UI応答性向上のため）
      setBookmarked(!bookmarked);
      
      // APIでブックマーク状態を更新
      if (bookmarked) {
        // ブックマークを取り消す
        const result = await unbookmarkPrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('ブックマークの取り消しに失敗しました');
        }
        // 成功したらトースト表示
        showGlobalToast("ブックマークを削除しました", "");
      } else {
        // ブックマークを追加
        const result = await bookmarkPrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('ブックマークの追加に失敗しました');
        }
        // 成功したらトースト表示
        showGlobalToast("ブックマークに追加しました", "");
      }
    } catch (error) {
      console.error('ブックマーク処理エラー:', error);
      
      // エラーが発生した場合、状態を元に戻す
      setBookmarked(bookmarked);
      
      // グローバルトースト表示
      showGlobalToast(
        "エラーが発生しました", 
        "操作をやり直してください。", 
        "destructive"
      );
    } finally {
      setIsBookmarkProcessing(false);
    }
  };
  
  // 非表示にする関数
  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ローカルストレージに保存
    try {
      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
      if (!hiddenPosts.includes(id)) {
        hiddenPosts.push(id);
        localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts));
      }
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
  
  // オプションメニューの表示切替
  const toggleOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !showOptions;
    
    // 開く場合は他のカードのドロップダウンを閉じるイベントを発行
    if (newState) {
      // このカードのIDを含めて、他のカードがこのカードを識別できるようにする
      window.dispatchEvent(new CustomEvent(DROPDOWN_TOGGLE_EVENT, { 
        detail: { cardId: id } 
      }));
    }
    
    setShowOptions(newState);
  };
  
  // 非表示なら何も表示しない
  if (isHidden) {
    return null;
  }
  
  return (
    <>
      <Link href={`/prompts/${promptId}`} passHref legacyBehavior>
        <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm cursor-pointer h-full" data-id={id}>
          <div className="block">
            <div className="relative pb-[56.25%]">
              <Image 
                width={100}
                height={100}
                src={thumbnailUrl || '/placeholder.jpg'}
                alt={title} 
                priority={true} 
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col p-2 flex-1">
            <div className="flex justify-between items-start mb-2">
              <div className={`line-clamp-2 text-gray-700 hover:text-prompty-primary flex-1 mr-2 h-12 overflow-hidden ${notoSansJP.className}`} style={{ fontWeight: 700 }}>
                {title}
              </div>
              
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
              <div className="flex items-center gap-2">
                <span className="block h-5 w-5 overflow-hidden rounded-full" onClick={(e) => e.stopPropagation()}>
                  <img 
                    src={user.avatarUrl} 
                    alt={user.account_name || user.name} 
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="text-xs text-gray-600">
                  {user.account_name || user.name}
                </span>
                <span className="text-xs text-gray-500">{postedAt}</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center text-gray-500 mt-3">
                  <button 
                    className={`like-button flex items-center ${liked ? 'text-pink-500' : 'text-gray-400'}`}
                    onClick={toggleLike}
                  >
                    <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-pink-500' : ''}`} />
                  </button>
                  <span className="text-xs">{currentLikeCount}</span>
                </div>
                <div className="flex items-center text-gray-500 mt-3 ml-2">
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
      </Link>

      {/* 報告ダイアログ */}
      <ReportDialog
        isOpen={reportDialogOpen}
        onClose={handleCloseReportDialog}
        targetId={promptId}
        promptId={promptId}
        userId={currentUser?.id || null}
        targetType="prompt"
      />
    </>
  );
};

// PromptGridコンポーネント
interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
  categoryPath?: string;  // カテゴリパスを追加（すべてを見るカードのリンク先）
}

const PromptGrid: React.FC<PromptGridProps> = ({ 
  prompts, 
  sectionPrefix = '',
  horizontalScroll = false,
  categoryPath = '' 
}) => {
  // 非表示の投稿を管理するための状態
  const [hiddenPromptIds, setHiddenPromptIds] = useState<string[]>([]);
  
  // 初期表示時に非表示リストを読み込む
  useEffect(() => {
    try {
      const storedHiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
      if (Array.isArray(storedHiddenPosts)) {
        setHiddenPromptIds(storedHiddenPosts);
      }
    } catch (error) {
      console.error('非表示リストの読み込みに失敗しました', error);
    }
  }, []);
  
  // 常に横スクロールのクラスを使用
  const containerClass = 'flex flex-nowrap overflow-x-auto pb-4 gap-3 snap-x snap-mandatory pr-4 -mr-4 scroll-smooth scrollbar-none w-auto min-w-0';
  
  // カードクラスの設定も常に横スクロールのものを使用
  const cardClass = 'flex-shrink-0 w-[180px] snap-start md:w-[200px] h-full pt-2';
  
  // 「すべてを見る」カードのクラス
  const viewAllCardClass = 'flex-shrink-0 w-[180px] snap-start md:w-[200px] h-100px pt-2';
  
  // 非表示処理の関数
  const handleHidePrompt = (id: string) => {
    console.log(`Hiding prompt with ID: ${id}`);
    
    try {
      // ローカルストレージから現在の非表示リストを取得
      const hiddenPosts = [...hiddenPromptIds];
      
      // IDをリストに追加（まだ含まれていない場合）
      if (!hiddenPosts.includes(id)) {
        hiddenPosts.push(id);
        // ステートを更新して再レンダリングを発生させる
        setHiddenPromptIds(hiddenPosts);
        // ローカルストレージに保存
        localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts));
        console.log('非表示リストを更新しました:', hiddenPosts);
      }
    } catch (error) {
      console.error('非表示処理に失敗しました', error);
    }
  };
  
  // 非表示の投稿を除外したリストを作成
  const visiblePrompts = prompts.filter(prompt => !hiddenPromptIds.includes(prompt.id));
  
  // 表示する最大カード数
  const maxVisibleCards = prompts.length <= 6 ? prompts.length : 9; // 6件以下なら全件、7件以上なら9件に制限
  const limitedPrompts = visiblePrompts.slice(0, maxVisibleCards);
  
  // カテゴリパスがない場合のデフォルトパス
  const viewAllPath = categoryPath || '/prompts';
  
  // デバッグ情報をコンソールに出力
  console.log(`PromptGrid デバッグ情報:
    - 渡されたプロンプト総数: ${prompts.length}
    - 非表示を除いた数: ${visiblePrompts.length}
    - 表示制限後の数: ${limitedPrompts.length}
    - カテゴリパス: ${categoryPath || 'なし'}
    - すべて見るカード表示: ${visiblePrompts.length > 6 ? 'はい' : 'いいえ'}
  `);
  
  return (
    <>
      <div className={containerClass}>
        {limitedPrompts.map((prompt) => (
          <div key={`${sectionPrefix}-${prompt.id}`} className={cardClass}>
            <PromptCard
              id={prompt.id}
              title={prompt.title}
              thumbnailUrl={prompt.thumbnailUrl}
              user={prompt.user}
              postedAt={prompt.postedAt}
              likeCount={prompt.likeCount}
              isLiked={prompt.isLiked}
              isBookmarked={prompt.isBookmarked}
              onHide={handleHidePrompt}
            />
          </div>
        ))}
        
        {/* すべてを見るカード（6件より多い場合のみ表示） */}
        {visiblePrompts.length > 6 && (
          <div className={viewAllCardClass}>
            <Link href={viewAllPath} passHref legacyBehavior>
              <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm cursor-pointer h-full" data-id="view-all">
                <div className="flex items-center justify-center h-full w-full p-2 bg-gray-100">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className={`text-gray-700 text-center ${notoSansJP.className}`} style={{ fontWeight: 700 }}>
                      すべてを見る
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
      <GlobalToast />
    </>
  );
};

export default PromptGrid;
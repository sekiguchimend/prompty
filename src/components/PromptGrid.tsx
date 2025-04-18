import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from './ui/use-toast';
import ReportDialog from './ReportDialog';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PromptItem } from '../pages/prompts/[id]';
import { likePrompt, unlikePrompt } from '../lib/like-service';
import { useAuth } from '../lib/auth-context';
import { checkIfLiked } from '../lib/like-service';

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
  onHide?: (id: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  thumbnailUrl,
  user,
  postedAt,
  likeCount,
  isLiked = false,
  onHide,
}) => {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser, isLoading } = useAuth();
  
  // IDはそのまま使う
  const promptId = id;
  
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
  
  // いいねをトグルする関数
  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 未ログインの場合はログインを促す
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "イイねするにはログインしてください。",
        variant: "destructive",
      });
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
      
      toast({
        title: "エラーが発生しました",
        description: "操作をやり直してください。",
        variant: "destructive",
      });
    } finally {
      setIsLikeProcessing(false);
    }
  };
  
  // 非表示にする関数
  const handleHide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onHide) {
      onHide(id);
    } else {
      toast({
        title: "投稿を非表示にしました",
        description: "このコンテンツは今後表示されません",
      });
    }
  };
  
  // 報告ダイアログを開く
  const openReportDialog = () => {
    setReportDialogOpen(true);
  };
  
  // オプションメニューの表示切替
  const toggleOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptions(!showOptions);
  };
  
  return (
    <Link href={`/prompts/${promptId}`} passHref legacyBehavior>
      <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm cursor-pointer h-full">
        <div className="block">
          <div className="relative pb-[56.25%]">
            <Image 
              width={100}
              height={100}
              src={thumbnailUrl || '/placeholder.jpg'}
              alt={title} 
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col p-3 flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="line-clamp-2 font-medium hover:text-prompty-primary flex-1 mr-2 h-12 overflow-hidden">
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
                      setShowOptions(false);
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
              <span className="block h-6 w-6 overflow-hidden rounded-full" onClick={(e) => e.stopPropagation()}>
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
              <div className="flex items-center text-gray-500 mt-4">
                <button 
                  className={`like-button flex items-center ${liked ? 'text-red-500' : 'text-gray-500'}`}
                  onClick={toggleLike}
                >
                  <Heart className={`mr-1 h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
                </button>
                <span className="text-xs">{currentLikeCount}</span>
              </div>
              <div className="flex items-center text-gray-500 mt-4 ml-2">
                <button className="like-button flex items-center">
                  <Bookmark className="mr-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 報告ダイアログ */}
        <ReportDialog 
          isOpen={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          postId={promptId}
        />
      </div>
    </Link>
  );
};

// PromptGridコンポーネント
interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
}

const PromptGrid: React.FC<PromptGridProps> = ({ 
  prompts, 
  sectionPrefix = '',
  horizontalScroll = false
}) => {
  // 横スクロール用のコンテナクラス
  const containerClass = horizontalScroll 
    ? 'flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory pr-4 -mr-4 scroll-smooth scrollbar-none' 
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4';
  
  // カードのクラス
  const cardClass = horizontalScroll 
    ? 'flex-shrink-0 w-[200px] snap-start md:w-[280px] h-full'
    : 'h-full';
  
  // 非表示処理の関数
  const handleHidePrompt = (id: string) => {
    console.log(`Hiding prompt with ID: ${id}`);
    // 実際の非表示処理をここに実装
  };
  
  return (
    <div className={containerClass}>
      {prompts.map((prompt) => (
        <div key={`${sectionPrefix}-${prompt.id}`} className={cardClass}>
          <PromptCard
            id={prompt.id}
            title={prompt.title}
            thumbnailUrl={prompt.thumbnailUrl}
            user={prompt.user}
            postedAt={prompt.postedAt}
            likeCount={prompt.likeCount}
            isLiked={prompt.isLiked}
            onHide={handleHidePrompt}
          />
        </div>
      ))}
    </div>
  );
};

export default PromptGrid;
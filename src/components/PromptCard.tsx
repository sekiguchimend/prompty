import React, { useState } from 'react';
import { Heart, Bookmark, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from './ui/use-toast';
import ReportDialog from './ReportDialog';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  
  const { toast } = useToast();
  
  // Extract the base ID without any prefix for the actual prompt ID
  const promptId = id.includes('-') ? id.split('-')[1] : id;
  
  // いいねをトグルする関数
  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLiked(!liked);
    setCurrentLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
  };
  
  // 非表示にする関数
  const handleHide = () => {
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
    e.stopPropagation();
    setShowOptions(!showOptions);
  };
  
  // カードクリック時の処理（詳細ページへ遷移）
  const handleCardClick = () => {
    router.push(`/prompts/${promptId}`);
  };
  
  return (
    <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm">
      <Link href={`/prompts/${promptId}`} className="block" onClick={handleCardClick}>
        <div className="relative pb-[56.25%]">
          <Image 
            width={100}
            height={100}
            src={thumbnailUrl || '/placeholder.jpg'}
            alt={title} 
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </Link>
      <div className="flex flex-col p-3">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/prompts/${promptId}`} className="line-clamp-2 font-medium hover:text-prompty-primary flex-1 mr-2">
            {title}
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
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <Link href={`/users/${user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
              <img 
                src={user.avatarUrl} 
                alt={user.account_name || user.name} 
                className="h-full w-full object-cover"
              />
            </Link>
            <Link href={`/users/${user.name}`} className="text-xs text-gray-600 hover:underline">
              {user.account_name || user.name}
            </Link>
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
  );
};

export default PromptCard;

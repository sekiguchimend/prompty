import React, { useState } from 'react';
import { Heart, Bookmark, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from './ui/use-toast';
import ReportDialog from './ReportDialog';
import Image from 'next/image';
interface PromptCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
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
  // Extract the base ID without any prefix for the actual prompt ID
  const promptId = id.includes('-') ? id.split('-')[1] : id;
  
  // 状態管理
  const [liked, setLiked] = useState(isLiked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
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
  
  return (
    <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm">
      <Link href={`/prompts/${promptId}`} className="block">
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center p-1 rounded-full text-gray-400 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openReportDialog}>
                報告する
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHide}>
                非表示にする
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <Link href={`/users/${user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="h-full w-full object-cover"
              />
            </Link>
            <Link href={`/users/${user.name}`} className="text-xs text-gray-600 hover:underline">
              {user.name}
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

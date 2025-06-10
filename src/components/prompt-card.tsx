import React, { useState, useEffect, useRef, memo } from 'react';
import { Heart, Bookmark, BookmarkPlus, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../hooks/use-toast';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '../hooks/useUser';
import { bookmarkPrompt, unbookmarkPrompt, checkIfBookmarked } from '../lib/bookmark-service';
import { notoSansJP } from '../../lib/fonts';
import { HeartIcon, EyeIcon } from './ui/icons';
import LazyImage from './common/LazyImage';
import VideoPlayer from './common/VideoPlayer';
import { Avatar } from './shared/Avatar';
import { getDisplayName } from '../lib/avatar-utils';
import { PromptItem } from '../pages/prompts/[id]';
import { likePrompt, unlikePrompt, checkIfLiked } from '../lib/like-service';
import { useAuth } from '../lib/auth-context';
import { UnifiedAvatar, DEFAULT_AVATAR_URL } from './index';
import ReportDialog from './shared/ReportDialog';

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
}

const PromptCard: React.FC<PromptCardProps> = ({
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
}) => {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBookmarkProcessing, setIsBookmarkProcessing] = useState(false);
  
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  
  // Extract the base ID without any prefix for the actual prompt ID
  const promptId = id.includes('-') ? id.split('-')[1] : id;
  
  // Supabaseクライアントの初期化
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // 初期状態でブックマーク状態といいね状態を確認
  useEffect(() => {
    const checkInitialState = async () => {
      if (!currentUser) return;
      
      // ブックマーク状態を確認
      const isBookmarked = await checkIfBookmarked(promptId, currentUser.id);
      setBookmarked(isBookmarked);
      
      // いいね状態を確認
      const isLiked = await checkIfLiked(promptId, currentUser.id);
      setLiked(isLiked);
    };
    
    checkInitialState();
  }, [currentUser, promptId]);
  
  // いいねをトグルする関数
  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください",
        variant: "destructive",
      });
      return;
    }
    
    // 楽観的更新（UIを先に更新）
    const wasLiked = liked;
    const previousCount = currentLikeCount;
    
    setLiked(!liked);
    setCurrentLikeCount(prevCount => liked ? prevCount - 1 : prevCount + 1);
    
    try {
      if (wasLiked) {
        // いいねを削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error("いいね削除エラー:", error);
          // エラー時は元の状態に戻す
          setLiked(wasLiked);
          setCurrentLikeCount(previousCount);
          toast({
            title: "いいねの削除に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        // いいねを追加
        const { error } = await supabase
          .from('likes')
          .insert({
            prompt_id: promptId,
            user_id: currentUser.id,
          });

        if (error) {
          console.error("いいね追加エラー:", error);
          // エラー時は元の状態に戻す
          setLiked(wasLiked);
          setCurrentLikeCount(previousCount);
          toast({
            title: "いいねの追加に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }
    } catch (err) {
      console.error("いいね処理中のエラー:", err);
      // エラー時は元の状態に戻す
      setLiked(wasLiked);
      setCurrentLikeCount(previousCount);
      toast({
        title: "エラーが発生しました",
        description: "操作に失敗しました。後でもう一度お試しください。",
        variant: "destructive",
      });
    }
  };
  
  // ブックマークをトグルする関数
  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "ブックマークするにはログインしてください",
        variant: "destructive"
      });
      return;
    }
    
    // 同時に複数回処理されないようにする
    if (isBookmarkProcessing) return;
    
    try {
      setIsBookmarkProcessing(true);
      
      // ブックマークの状態を楽観的に更新（UI応答性向上のため）
      setBookmarked(!bookmarked);
      
      if (bookmarked) {
        // ブックマークを削除
        const result = await unbookmarkPrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('ブックマークの取り消しに失敗しました');
        }
        
        toast({
          title: "ブックマークを削除しました",
        });
      } else {
        // ブックマークを追加
        const result = await bookmarkPrompt(promptId, currentUser.id);
        if (!result.success) {
          throw new Error('ブックマークの追加に失敗しました');
        }
        
        toast({
          title: "ブックマークに追加しました",
        });
      }
    } catch (error) {
      console.error('ブックマークエラー:', error);
      
      // エラーが発生した場合、状態を元に戻す
      setBookmarked(bookmarked);
      
      toast({
        title: "エラーが発生しました",
        description: "操作に失敗しました。後でもう一度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsBookmarkProcessing(false);
    }
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
  
  // クリックハンドラーをカード外に配置
  React.useEffect(() => {
    // ドロップダウンが開いている時のみクリックイベントを設定
    if (showDropdown) {
      const handleOutsideClick = () => setShowDropdown(false);
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showDropdown]);
  
  return (
    <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm min-h-[340px]">
      <Link href={`/prompts/${promptId}`} className="block" prefetch={false}>
        <div className="relative pb-[56.25%]">
          {(() => {
            console.log('🎨 PromptCardメディアタイプ判定:', {
              id: promptId,
              title: title?.substring(0, 30),
              mediaType,
              thumbnailUrl,
              isVideo: mediaType === 'video'
            });
            
            return mediaType === 'video' ? (
              <VideoPlayer
                src={thumbnailUrl}
                alt={title}
                className="absolute inset-0 h-full w-full"
                hoverToPlay={true}
                tapToPlay={true}
                muted={true}
                loop={true}
                showThumbnail={true}
                onLinkClick={() => {
                  // プログラム的にナビゲーション
                  window.location.href = `/prompts/${promptId}`;
                }}
              />
            ) : (
              <Image 
                width={100}
                height={100}
                src={thumbnailUrl || '/images/default-thumbnail.svg'}
                alt={title} 
                priority={false}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
            );
          })()}
        </div>
      </Link>
      <div className="flex flex-col p-3">
        <div className="flex justify-between items-start mb-2">
        <Link href={`/prompts/${promptId}`} prefetch={false} passHref legacyBehavior>
          <a className={`line-clamp-2 font-extrabold hover:text-prompty-primary flex-1 mr-2 ${notoSansJP.className}`}
          style={{ 
            fontWeight: 900, 
            textShadow: '0.03em 0 0 currentColor', // テキストに微妙なシャドウを追加して太く見せる
          }}
        >
    {title}
  </a>
</Link>
          
          {/* シンプルな三点メニュー実装 */}
          
           
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
              <button 
                className={`bookmark-button flex items-center ${bookmarked ? 'text-blue-500' : 'text-gray-500'}`}
                onClick={toggleBookmark}
              >
                <Bookmark className={`mr-1 h-4 w-4 ${bookmarked ? 'fill-blue-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
    
    </div>
  );
};

export default memo(PromptCard);

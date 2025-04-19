import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../lib/auth-context';
import { followUser, unfollowUser, checkIfFollowing } from '../../lib/follow-service';

interface AuthorSidebarProps {
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    userId?: string;  // 著者のユーザーID
  };
  tags: string[];
  website: string;
}

const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ author, tags, website }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ログインユーザー情報を取得
  const { user: currentUser } = useAuth();
  
  // フォロー状態を確認
  useEffect(() => {
    const checkFollowStatus = async () => {
      // ログインしていない場合またはauthorIdがない場合はスキップ
      if (!currentUser || !author.userId) return;
      
      try {
        // フォロー状態を確認
        const isFollowed = await checkIfFollowing(author.userId, currentUser.id);
        setIsFollowing(isFollowed);
      } catch (error) {
        console.error('フォロー状態確認エラー:', error);
      }
    };
    
    checkFollowStatus();
  }, [currentUser, author.userId]);

  const handleFollowClick = async () => {
    // ログインしていない場合はログインを促す
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "ユーザーをフォローするにはログインしてください。",
        variant: "destructive",
      });
      return;
    }
    
    // 著者IDがない場合は処理しない
    if (!author.userId) {
      console.error('著者IDが見つかりません');
      toast({
        title: "エラーが発生しました",
        description: "この作者をフォローできません。",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnimating(true);
    setIsLoading(true);
    
    try {
      let result;
      
      if (isFollowing) {
        // フォロー解除
        result = await unfollowUser(author.userId, currentUser.id);
      } else {
        // フォロー追加
        result = await followUser(author.userId, currentUser.id);
      }
      
      if (result.success) {
        // フォロー状態を更新
        setIsFollowing(!isFollowing);
        
        // トースト通知表示
        if (!isFollowing) {
          toast({
            title: `${author.name}さんをフォローしました`,
            description: "新しい投稿があればお知らせします",
          });
        } else {
          toast({
            title: `${author.name}さんのフォローを解除しました`,
            variant: "destructive"
          });
        }
      } else {
        // エラーメッセージを表示
        toast({
          title: "エラーが発生しました",
          description: "操作をやり直してください。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('フォロー処理エラー:', error);
      toast({
        title: "エラーが発生しました",
        description: "操作をやり直してください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <div className="sticky top-20">
      <div className="flex flex-col items-start">
        {/* Author profile section */}
        <div className="flex items-center mb-2">
            <div className="w-10 h-10 overflow-hidden mr-2 rounded-lg">
              <img 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium">{author.name}</h3>
              <p className="text-xs text-gray-500">{author.bio}</p>
            </div>
          
        </div>
        
        <div className="text-xs text-gray-500 space-y-2 mb-4">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center">
              {index === 0 && <span className="mr-1">👉</span>}
              <span>{tag}</span>
            </div>
          ))}
          <div className="pt-1">
            <a href={website} className="text-gray-400 hover:text-gray-600 text-xs truncate block">
              {website}
            </a>
          </div>
        </div>
        
        <Button 
          variant={isFollowing ? "outline" : "default"}
          className={`w-full mb-4 ${
            isFollowing 
              ? 'border border-gray-300 hover:bg-gray-100 text-gray-900' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } rounded-sm text-sm py-1 h-auto transition-all duration-200 ${
            isAnimating ? 'scale-95' : ''
          }`}
          onClick={handleFollowClick}
          disabled={isLoading}
        >
          <span className="mr-1">{isFollowing ? '✓' : '👤'}</span> 
          {isFollowing ? 'フォロー中' : 'フォロー'}
        </Button>
      </div>
    </div>
  );
};

export default AuthorSidebar;

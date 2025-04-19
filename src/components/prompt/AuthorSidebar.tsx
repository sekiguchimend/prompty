import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { toast } from '../../components/ui/use-toast';
import { followUser, unfollowUser, checkIfFollowing } from '../../lib/follow-service';
import { supabase } from '../../lib/supabaseClient';

interface AuthorSidebarProps {
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
  };
  tags: string[];
  website: string;
  authorId?: string; // 著者IDを追加
}

const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ author, tags, website, authorId }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 現在のログインユーザーを取得
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        
        // ユーザーとフォロー状態が取得できたらフォロー状態を確認
        if (session?.user && authorId) {
          const isFollowingAuthor = await checkIfFollowing(authorId, session.user.id);
          setIsFollowing(isFollowingAuthor);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
        setIsLoading(false);
      }
    };
    
    fetchCurrentUser();
    
    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setCurrentUser(session?.user || null);
      
      // ログイン時にフォロー状態を確認
      if (session?.user && authorId && event === 'SIGNED_IN') {
        const isFollowingAuthor = await checkIfFollowing(authorId, session.user.id);
        setIsFollowing(isFollowingAuthor);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [authorId]);

  const handleFollowClick = async () => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "フォロー機能を使用するにはログインしてください",
        variant: "destructive"
      });
      return;
    }
    
    if (!authorId) {
      console.error('著者IDが指定されていません');
      toast({
        title: "エラーが発生しました",
        description: "著者情報を取得できませんでした",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnimating(true);
    
    try {
      if (isFollowing) {
        // フォロー解除
        const result = await unfollowUser(authorId, currentUser.id);
        if (result.success) {
          setIsFollowing(false);
          toast({
            title: `${author.name}さんのフォローを解除しました`,
            variant: "destructive"
          });
        } else {
          throw new Error('フォロー解除に失敗しました');
        }
      } else {
        // フォローする
        const result = await followUser(authorId, currentUser.id);
        if (result.success) {
          setIsFollowing(true);
          toast({
            title: `${author.name}さんをフォローしました`,
            description: "新しい投稿があればお知らせします",
          });
        } else {
          throw new Error('フォロー追加に失敗しました');
        }
      }
    } catch (error) {
      console.error('フォロー処理中にエラーが発生しました:', error);
      toast({
        title: "エラーが発生しました",
        description: "フォロー処理に失敗しました。後でもう一度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsAnimating(false);
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
          {isLoading ? '読み込み中...' : isFollowing ? 'フォロー中' : 'フォロー'}
        </Button>
      </div>
    </div>
  );
};

export default AuthorSidebar;

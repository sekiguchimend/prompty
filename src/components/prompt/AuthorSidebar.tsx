import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { toast } from '../../components/ui/use-toast';
import { supabase } from '../../lib/supabaseClient';
import { UnifiedAvatar } from '../index';

interface AuthorSidebarProps {
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    userId: string;
  };
  tags: string[];
  website: string;
}

const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ author, tags, website }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
    };
    
    fetchUser();
    
    // ユーザー認証状態の監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // フォロー状態の確認
  useEffect(() => {
    if (currentUser && author.userId) {
      checkUserFollowStatus();
    }
  }, [currentUser, author.userId]);

  // ユーザーがフォローしているか確認
  const checkUserFollowStatus = async () => {
    if (!currentUser || !author.userId) return;

    try {
      // シンプルなクエリに修正
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', author.userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setIsFollowing(true);
      } else if (error) {
        console.error("フォロー状態取得エラー:", error);
      }
    } catch (err) {
      console.error("フォロー状態取得エラー:", err);
    }
  };

  // フォロー/アンフォローを処理する関数
  const toggleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "フォローするにはログインしてください",
        variant: "destructive",
      });
      return false;
    }

    if (!author.userId || isFollowLoading) return false;

    // 自分自身をフォローできないようにする制限を追加
    if (currentUser.id === author.userId) {
      toast({
        title: "自分自身をフォローすることはできません",
        variant: "destructive",
      });
      return false;
    }

    setIsFollowLoading(true);
    setIsAnimating(true);
    
    try {
      if (isFollowing) {
        // フォロー解除 - ヘッダーを明示的に設定
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', author.userId);

        if (error) {
          console.error("フォロー解除エラー:", error);
          toast({
            title: "フォロー解除に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらフォロー状態を更新
        setIsFollowing(false);
        return true;
      } else {
        // フォロー追加 - ヘッダーを明示的に設定
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: author.userId,
          });

        if (error) {
          console.error("フォロー追加エラー:", error);
          toast({
            title: "フォロー追加に失敗しました",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        // 成功したらフォロー状態を更新
        setIsFollowing(true);
        return true;
      }
    } catch (err) {
      console.error("フォロー処理中のエラー:", err);
      toast({
        title: "エラーが発生しました",
        variant: "destructive",
      });
      return false;
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
        setIsFollowLoading(false);
      }, 300);
    }
  };

  const handleFollowClick = async () => {
    const success = await toggleFollow();
    
    if (success) {
      // 操作が成功した場合のみトースト表示
      if (isFollowing) {
        toast({
          title: `${author.name}さんのフォローを解除しました`,
          variant: "destructive"
        });
      } else {
        toast({
          title: `${author.name}さんをフォローしました`,
          description: "新しい投稿があればお知らせします",
        });
      }
    }
  };

  // URLを表示用に加工する関数
  const formatWebsiteUrl = (url: string) => {
    if (!url) return '';
    
    try {
      // URLからホスト名を抽出
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      // 無効なURLの場合はそのまま返す
      return url;
    }
  };

  return (
    <div className="sticky top-20">
      <div className="flex flex-col items-start">
        {/* Author profile section */}
        <div className="flex items-center mb-2">
          <Link href={`/users/${author.userId}`}>
            <UnifiedAvatar
              src={author.avatarUrl}
              displayName={author.name}
              size="md"
              className="mr-2 cursor-pointer"
            />
          </Link>
          <div>
            <Link href={`/users/${author.userId}`}>
              <h3 className="text-sm font-medium hover:text-gray-900 cursor-pointer">{author.name}</h3>
            </Link>
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
          {website && (
            <div className="pt-1">
              <a 
                href={website} 
                className="text-gray-400 hover:text-gray-600 text-xs truncate block max-w-full overflow-hidden"
                title={website}
              >
                {formatWebsiteUrl(website)}
              </a>
            </div>
          )}
        </div>
        
        {/* フォローボタン - 自分自身の場合は表示しない */}
        {currentUser && author.userId && currentUser.id !== author.userId && (
        <Button 
          className={`w-full mb-4 ${
            isFollowing 
              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          } rounded-md text-sm py-2 px-6 h-auto transition-all duration-200 ${
            isAnimating ? 'scale-95' : ''
          } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleFollowClick}
          disabled={isFollowLoading}
        >
          {isFollowing ? (
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              フォロー中
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              フォローする
            </span>
          )}
        </Button>
        )}
      </div>
    </div>
  );
};

export default AuthorSidebar;

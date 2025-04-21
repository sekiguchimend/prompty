import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { toast } from '../../components/ui/use-toast';
import { supabase } from '../../lib/supabaseClient';

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
        
        <Button 
          variant={isFollowing ? "outline" : "default"}
          className={`w-full mb-4 ${
            isFollowing 
              ? 'border border-gray-300 hover:bg-gray-100 text-gray-900' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } rounded-sm text-sm py-1 h-auto transition-all duration-200 ${
            isAnimating ? 'scale-95' : ''
          } ${isFollowLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleFollowClick}
          disabled={isFollowLoading}
        >
          <span className="mr-1">{isFollowing ? '✓' : '👤'}</span> 
          {isFollowing ? 'フォロー中' : 'フォロー'}
        </Button>
      </div>
    </div>
  );
};

export default AuthorSidebar;

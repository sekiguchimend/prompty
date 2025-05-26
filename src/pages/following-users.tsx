import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, UserPlus, Loader2, ChevronDown, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/use-toast';
import { Button } from '../components/ui/button';
import { useInView } from 'react-intersection-observer';
import Footer from '../components/footer';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { UnifiedAvatar, DEFAULT_AVATAR_URL } from '../components/index';

// ページあたりのユーザー数を定義
const USERS_PER_PAGE = 20;

// ユーザープロファイル型定義
interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// フォローユーザー型定義
interface FollowingUser extends UserProfile {
  created_at: string; // フォロー日時
}

// レスポンス型定義
interface FollowingUsersResponse {
  users: FollowingUser[];
  hasMore: boolean;
  nextCursor?: string;
}

// メモ化されたデータ取得関数 - ページネーション対応
const fetchFollowingUsersData = async (
  userId: string | undefined, 
  cursor?: string,
  limit: number = USERS_PER_PAGE
): Promise<FollowingUsersResponse> => {
  if (!userId) return { users: [], hasMore: false };
  
  try {
    // 1. フォローしているユーザーのデータを取得（プロフィール情報も含めて）
    let query = supabase
      .from('follows')
      .select(`
        following_id,
        created_at,
        profiles!follows_following_id_fkey(id, username, display_name, avatar_url, bio)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // 次のページがあるかを確認するために1つ多く取得
    
    // カーソルが指定されている場合は、そこから開始
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data: followingData, error: followingError } = await query;
    
    if (followingError) {
      console.error('フォロー中ユーザー取得エラー:', followingError);
      return { users: [], hasMore: false };
    }
    
    if (!followingData || followingData.length === 0) {
      return { users: [], hasMore: false };
    }
    
    // 次のページがあるかどうかを確認
    const hasMore = followingData.length > limit;
    // 表示用のデータは制限内に収める
    const displayUsers = hasMore ? followingData.slice(0, limit) : followingData;
    
    // 次のカーソル値を取得（最後のフォロー関係の作成日）
    const nextCursor = hasMore && displayUsers.length > 0 
      ? displayUsers[displayUsers.length - 1].created_at as string
      : undefined;
    
    // 整形したユーザーデータを作成
    const formattedUsers = displayUsers.map(item => {
      // プロフィールデータの取得
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      
      // フォロー日をフォーマット
      const followDate = new Date(item.created_at as string);
      const formattedDate = `${followDate.getFullYear()}/${followDate.getMonth() + 1}/${followDate.getDate()}`;
      
      return {
        id: profile?.id || '',
        username: profile?.username || '不明なユーザー',
        display_name: profile?.display_name || profile?.username || '不明なユーザー',
        avatar_url: profile?.avatar_url || DEFAULT_AVATAR_URL,
        bio: profile?.bio || '',
        created_at: formattedDate
      };
    });
    
    return { 
      users: formattedUsers,
      hasMore,
      nextCursor
    };
  } catch (error) {
    return { users: [], hasMore: false };
  }
};

const FollowingUsers: React.FC = () => {
  // ユーザーデータ
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // 無限スクロール用の参照
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });
  
  const { toast } = useToast();

  // 現在のユーザーを取得
  useEffect(() => {
    let isActive = true;
    const fetchUser = async () => {
      try {
        // セッションクエリを一度のみ実行
        const { data: { session } } = await supabase.auth.getSession();
        
        // コンポーネントがマウントされている場合のみ状態を更新
        if (isActive) {
          setCurrentUser(session?.user || null);
          
          // ログインしていない場合はローディング状態を解除
          if (!session) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUser();
    
    // ユーザー認証状態の監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (isActive) {
        setCurrentUser(session?.user || null);
        if (!session) {
          setIsLoading(false);
        }
      }
    });
    
    return () => {
      isActive = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // 初回のフォローユーザーを取得
  useEffect(() => {
    let isActive = true;
    
    const loadFollowingUsers = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      
      try {
        // 最適化されたデータ取得関数を使用
        const result = await fetchFollowingUsersData(currentUser.id);
        
        if (isActive) {
          setFollowingUsers(result.users);
          setHasMore(result.hasMore);
          setCursor(result.nextCursor);
          setIsLoading(false);
        }
      } catch (error) {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    
    if (currentUser) {
      loadFollowingUsers();
    }
    
    return () => {
      isActive = false;
    };
  }, [currentUser]);
  
  // 無限スクロールの監視
  useEffect(() => {
    // 画面内に入った & ローディング中でない & さらにデータがある場合
    if (inView && !isLoadingMore && hasMore) {
      loadMoreUsers();
    }
  }, [inView, isLoadingMore, hasMore]);
  
  // 追加のユーザーを読み込む関数
  const loadMoreUsers = useCallback(async () => {
    if (!currentUser || !cursor || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const result = await fetchFollowingUsersData(currentUser.id, cursor);
      
      setFollowingUsers(prev => [...prev, ...result.users]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (error) {
      console.error('追加のユーザー取得エラー:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentUser, cursor, isLoadingMore, hasMore]);

  // フォロー解除の処理
  const unfollowUser = useCallback(async (userId: string) => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "フォロー解除するにはログインしてください",
        variant: "destructive",
      });
      return;
    }

    try {
      // UI上ですぐに反映（楽観的更新）
      setFollowingUsers(prev => prev.filter(user => user.id !== userId));
      
      // バックグラウンドでDBを更新
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);
        
      if (error) {
        console.error('フォロー解除エラー:', error);
        toast({
          title: "エラーが発生しました",
          description: "フォロー解除に失敗しました",
          variant: "destructive",
        });
        
        // エラー時は再取得（理想的にはエラー時のみ元の状態に復元する）
        const result = await fetchFollowingUsersData(currentUser.id);
        setFollowingUsers(result.users);
      } else {
        toast({
          title: "フォロー解除しました",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('フォロー解除中のエラー:', error);
    }
  }, [currentUser, toast]);
  
  // コンテンツがない場合の表示（メモ化）
  const EmptyFollowingState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <UserPlus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">まだフォローしているユーザーがいません</h3>
      <p className="text-gray-500 max-w-md mb-6">
        あなたの興味に合った著者やクリエイターをフォローすると、その投稿がタイムラインに表示されます。新しいユーザーを見つけるには探索ページをチェックしてみましょう。
      </p>
      <Link href="/">
        <Button variant="default" className="rounded-full">
          探索ページへ
        </Button>
      </Link>
    </div>
  ), []);
  
  // ログインが必要な場合の表示（メモ化）
  const NeedLoginState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <UserPlus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">ログインしてフォロー機能を使おう</h3>
      <p className="text-gray-500 max-w-md mb-6">
        ログインすると、お気に入りの著者をフォローして最新の投稿を確認できます。
      </p>
      <Link href="/login">
        <Button variant="default" className="rounded-full">
          ログインする
        </Button>
      </Link>
    </div>
  ), []);
  
  const LoadingState = useMemo(() => (
    <div className="flex justify-center py-12">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  ), []);
  
  // ユーザーカードコンポーネント
  const UserCard = useCallback(({ user }: { user: FollowingUser }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <Link href={`/users/${user.username}`} className="flex items-center space-x-4 flex-1">
        <UnifiedAvatar
          src={user.avatar_url}
          displayName={user.display_name || user.username}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{user.display_name || user.username}</h3>
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
          {user.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>}
          <p className="text-xs text-gray-400 mt-1">フォロー日: {user.created_at}</p>
        </div>
      </Link>
      <Button 
        variant="outline" 
        size="sm"
        className="ml-4"
        onClick={(e) => {
          e.preventDefault();
          unfollowUser(user.id);
        }}
      >
        <UserMinus className="h-4 w-4 mr-1" />
        フォロー解除
      </Button>
    </div>
  ), [unfollowUser]);
  
  // 「もっと読み込む」ボタンとインジケーター
  const LoadMoreElement = useMemo(() => (
    <div 
      ref={loadMoreRef}
      className={`flex justify-center items-center py-8 ${!hasMore ? 'hidden' : ''}`}
    >
      {isLoadingMore ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">読み込み中...</span>
        </div>
      ) : hasMore && followingUsers.length > 0 ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadMoreUsers}
          className="rounded-full px-4 py-2 border border-gray-300 shadow-sm hover:bg-gray-50"
        >
          もっと見る
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  ), [hasMore, isLoadingMore, followingUsers.length, loadMoreUsers, loadMoreRef]);
  
  return (
    <>
      <main className="flex-1 pb-12 mt-20 md:mt-16">
        <div className="container mx-auto px-4">
          <div className="mt-4">
            <div className="pb-3 px-4 flex items-center">
              <h2 className="text-xl font-bold">フォロー中のユーザー</h2>
              <span className="text-gray-500 ml-1">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
            
            {isLoading ? LoadingState : 
             !currentUser ? NeedLoginState : 
             followingUsers.length === 0 ? EmptyFollowingState : 
             <div className="bg-white rounded-lg shadow-sm border">
               {followingUsers.map((user) => (
                 <UserCard key={user.id} user={user} />
               ))}
               {LoadMoreElement}
             </div>
            }
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default FollowingUsers; 
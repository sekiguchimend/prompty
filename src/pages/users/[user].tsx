import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../../components/footer';
import { Button } from '../../components/ui/button';
import { Heart, MessageSquare, Eye, MoreHorizontal, BookOpen, BellOff, ShieldAlert, Ban } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../lib/auth-context';
import { UnifiedAvatar } from '../../components/index';
import { supabase } from '../../lib/supabaseClient';
import FollowModal from '../../components/modals/FollowModal';

// ユーザーデータの型定義
interface UserData {
  id: string;
  display_name: string;
  account_name: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  isFollowed: boolean;
}

// 投稿データの型定義
interface PostData {
  id: string;
  title: string;
  thumbnailUrl?: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  description?: string;
  price: number;
  isFree: boolean;
}

const UserPage: React.FC = () => {
  const router = useRouter();
  const { user: userParam } = router.query;
  const [activeTab, setActiveTab] = useState<string>('新着');
  const [isFollowing, setIsFollowing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フォローモーダルの状態
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [followModalTitle, setFollowModalTitle] = useState('');
  
  // 画面サイズを検出
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // ユーザーデータを取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userParam) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // ユーザー情報を取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userParam)
          .single();

        if (profileError) {
          setError('ユーザーが見つかりませんでした');
          return;
        }

        // フォロワー数を取得
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userParam);

        // フォロー数を取得
        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userParam);

        // 現在のユーザーがこのユーザーをフォローしているかチェック
        let isFollowed = false;
        if (user) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userParam)
            .single();
          
          isFollowed = !!followData;
        }

        setUserData({
          id: profileData.id,
          display_name: profileData.display_name || profileData.name || 'ユーザー',
          account_name: profileData.account_name || '',
          bio: profileData.bio || '',
          avatarUrl: profileData.avatar_url || '/images/default-avatar.png',
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          isFollowed
        });

        setIsFollowing(isFollowed);

        // ログインユーザーのプロフィールかどうかを判定
        if (user) {
          setIsOwnProfile(userParam === user.id);
        }

        // ユーザーの投稿を取得
        const { data: postsData, error: postsError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            created_at,
            description,
            price,
            is_free,
            published,
            view_count,
            like_count
          `)
          .eq('author_id', userParam)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (postsError) {
        } else {
          const formattedPosts: PostData[] = postsData.map(post => ({
            id: post.id,
            title: post.title,
            thumbnailUrl: post.thumbnail_url,
            publishedAt: formatDate(post.created_at),
            views: post.view_count || 0,
            likes: post.like_count || 0,
            comments: 0, // コメント数は別途取得が必要な場合は実装
            description: post.description,
            price: post.price || 0,
            isFree: post.is_free || post.price === 0
          }));

          setUserPosts(formattedPosts);
        }

      } catch (error) {
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userParam, user]);

  // 日付フォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1日前';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };
  
  // 画面サイズに基づくブレイクポイント
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // フォロー状態を切り替える
  const toggleFollow = async () => {
    if (!user || !userData) {
      toast({
        title: "ログインが必要です",
        description: "フォローするにはログインしてください",
      });
      return;
    }

    try {
      if (isFollowing) {
        // フォロー解除
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userData.id);

        if (error) throw error;

        setIsFollowing(false);
        setUserData(prev => prev ? {
          ...prev,
          followersCount: prev.followersCount - 1
        } : null);

        toast({
          title: "フォローを解除しました",
          description: `${userData.display_name}さんのフォローを解除しました`,
        });
      } else {
        // フォロー追加
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userData.id
          });

        if (error) throw error;

        setIsFollowing(true);
        setUserData(prev => prev ? {
          ...prev,
          followersCount: prev.followersCount + 1
        } : null);

        toast({
          title: "フォローしました",
          description: `${userData.display_name}さんをフォローしました。新しい投稿があるとタイムラインに表示されます`,
        });
      }
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "フォロー処理に失敗しました。もう一度お試しください。",
      });
    }
  };
  
  // アクティブなタブに基づいて投稿を表示
  const getActivePosts = () => {
    // 人気順の場合は閲覧数でソート
    if (activeTab === '人気') {
      return [...userPosts].sort((a, b) => b.views - a.views);
    }
    // 新着順の場合はそのまま（既にcreated_atの降順で取得済み）
    return userPosts;
  };
  
  // ユーザーをブロックする
  const handleBlockUser = () => {
    if (!userData) return;
    toast({
      title: "ユーザーをブロックしました",
      description: `${userData.display_name}さんをブロックしました。このユーザーからの投稿は表示されなくなります。`,
    });
  };

  // ユーザーをミュートする
  const handleMuteUser = () => {
    if (!userData) return;
    toast({
      title: "ユーザーをミュートしました",
      description: `${userData.display_name}さんをミュートしました。このユーザーからの通知は届かなくなります。`,
    });
  };

  // ユーザーを通報する
  const handleReportUser = () => {
    toast({
      title: "通報を受け付けました",
      description: "ご報告ありがとうございます。内容を確認いたします。",
    });
  };
  
  // フォロワー一覧を開く
  const openFollowersModal = () => {
    setFollowModalType('followers');
    setFollowModalTitle(`${userData?.display_name}のフォロワー`);
    setFollowModalOpen(true);
  };

  // フォロー一覧を開く
  const openFollowingModal = () => {
    setFollowModalType('following');
    setFollowModalTitle(`${userData?.display_name}がフォロー中`);
    setFollowModalOpen(true);
  };
  
  // フォロー状態変更時のコールバック
  const handleFollowChange = async () => {
    if (!userParam) return;
    
    try {
      // フォロワー数を再取得
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userParam);

      // フォロー数を再取得
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userParam);

      // ユーザーデータを更新
      setUserData(prev => prev ? {
        ...prev,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0
      } : null);
    } catch (error) {
      console.error('フォロー数更新エラー:', error);
    }
  };
  
  // 投稿カードをレンダリング
  const renderPostCard = (post: PostData) => (
    <Link href={`/prompts/${post.id}`} key={post.id} className="block">
      <article className="mb-6 pb-6 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-4 cursor-pointer">
        <div className="flex flex-col md:flex-row gap-4">
          {post.thumbnailUrl && (
            <div className="md:w-40 h-40 md:h-28 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
              <img 
                src={post.thumbnailUrl} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-base md:text-lg font-bold text-gray-800 hover:text-gray-600 mb-2 md:mb-3 line-clamp-2">
                  {post.title}
                </h2>
              </div>
              
              {/* 価格表示 */}
              {post.price > 0 && !post.isFree && (
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    ¥{post.price.toLocaleString()}
                  </span>
                </div>
              )}
              {post.isFree && (
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    無料
                  </span>
                </div>
              )}
            </div>
            
            {post.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {post.description}
              </p>
            )}
            
            <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
              <div className="flex items-center mr-4">
                <UnifiedAvatar
                  src={userData?.avatarUrl || '/images/default-avatar.png'}
                  displayName={userData?.display_name || 'ユーザー'}
                  size="xs"
                  className="mr-1.5"
                />
                <span>{userData?.display_name || 'ユーザー'}</span>
              </div>
              <span>{post.publishedAt}</span>
            </div>
            
            <div className="flex items-center gap-4 text-gray-500 text-xs md:text-sm">
              <div className="flex items-center">
                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span>{post.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span>{post.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span>{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
  
  // ローディング状態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="">
          <div className="container mx-auto px-4 max-w-4xl py-8">
            <div className="animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (error || !userData) {
    return (
      <div className="min-h-screen bg-white">
        <main className="">
          <div className="container mx-auto px-4 max-w-4xl py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {error || 'ユーザーが見つかりませんでした'}
              </h1>
              <Button onClick={() => router.push('/')}>
                ホームに戻る
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <main className="">
        {/* プロフィールヘッダー */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-4xl py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
              {/* アバター */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <UnifiedAvatar
                  src={userData.avatarUrl}
                  displayName={userData.display_name}
                  size="xl"
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-200"
                />
              </div>
              
              {/* プロフィール情報 */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold">{userData.display_name}</h1>
                    {userData.account_name && (
                      <p className="text-gray-500 text-sm">@{userData.account_name}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                      {isFollowing ? 'フォローしています' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <Button 
                        variant="outline"
                        className="px-4 py-2 text-sm h-9 rounded-full border-gray-300"
                        onClick={() => router.push('/SettingsPage?tab=account')}
                      >
                        プロフィールを編集
                      </Button>
                    ) : (
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        className={`px-4 py-2 text-sm h-9 ${isFollowing ? 'rounded-full border-gray-300' : 'rounded-full bg-black hover:bg-gray-800'}`}
                        onClick={toggleFollow}
                      >
                        {isFollowing ? 'フォロー中' : 'フォローする'}
                      </Button>
                    )}
                    
                    {!isOwnProfile && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="p-2 h-9 w-9 rounded-full border-gray-300">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleMuteUser} className="cursor-pointer">
                            <BellOff className="mr-2 h-4 w-4" /> 
                            <span>ミュート</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBlockUser} className="cursor-pointer">
                            <Ban className="mr-2 h-4 w-4" /> 
                            <span>ユーザーをブロック</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleReportUser} className="cursor-pointer text-red-500">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            <span>通報する</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                {/* プロフィール本文 */}
                <div className="my-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{userData.bio}</p>
                </div>
                
                {/* フォロー情報 */}
                <div className="flex justify-center md:justify-start space-x-6 text-sm">
                  <div className="flex items-center">
                    <span className="font-bold">{userPosts.length}</span>
                    <span className="ml-1 text-gray-500">投稿</span>
                  </div>
                  <button 
                    className="flex items-center hover:underline cursor-pointer"
                    onClick={openFollowingModal}
                  >
                    <span className="font-bold">{userData.followingCount}</span>
                    <span className="ml-1 text-gray-500">フォロー</span>
                  </button>
                  <button 
                    className="flex items-center hover:underline cursor-pointer"
                    onClick={openFollowersModal}
                  >
                    <span className="font-bold">{userData.followersCount}</span>
                    <span className="ml-1 text-gray-500">フォロワー</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* タブセクション */}
        <div className="border-b border-gray-200 sticky top-16 bg-white z-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <Tabs 
              defaultValue="新着" 
              className="w-full" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 md:flex md:flex-row bg-transparent h-auto p-0 gap-0">
                <TabsTrigger 
                  value="新着"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  新着 ({userPosts.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="人気"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  人気 ({getActivePosts().length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* コンテンツセクション */}
        <div className="container mx-auto px-4 max-w-4xl my-4 md:my-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* メインコンテンツ - 投稿一覧 */}
            <div className="flex-1">
              {getActivePosts().length > 0 ? (
                getActivePosts().map(renderPostCard)
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <BookOpen className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    まだ投稿がありません
                  </h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? '最初の投稿を作成してみましょう' 
                      : 'このユーザーはまだ投稿していません'
                    }
                  </p>
                  {isOwnProfile && (
                    <Button 
                      className="mt-4"
                      onClick={() => router.push('/create')}
                    >
                      投稿を作成
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* フォローモーダル */}
      {userData && (
        <FollowModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={userData.id}
          type={followModalType}
          title={followModalTitle}
          onFollowChange={handleFollowChange}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default UserPage;

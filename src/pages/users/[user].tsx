import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Footer from '../../components/footer';
import { Button } from '../../components/ui/button';
import { ChevronRight, Heart, MessageSquare, Eye, MoreHorizontal, BookOpen, BellOff, ShieldAlert, Ban } from 'lucide-react';
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

// ユーザーデータの型定義
interface UserData {
  id: string;
  name: string;
  displayName: string;
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
}

// マガジンデータの型定義
interface MagazineData {
  id: string;
  title: string;
  coverUrl: string;
  articlesCount: number;
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
  
  // 画面サイズを検出
  useEffect(() => {
    // クライアントサイドでのみwindowオブジェクトにアクセス
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // URLが変更されたときにデータをリセット
  useEffect(() => {
    if (userParam) {
      console.log('User parameter:', userParam);
      
      // ログインユーザーのプロフィールかどうかを判定
      if (user) {
        // 実際のアプリでは、userParamとuser.idなどを比較する
        // この例では単純に比較していますが、実際には適切なIDやユーザー名を比較する必要があります
        setIsOwnProfile(userParam === user.id || userParam === user.email?.split('@')[0]);
      }
    }
  }, [userParam, user]);
  
  // 画面サイズに基づくブレイクポイント
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // サンプルユーザーデータ（実際はAPIから取得）
  const userData: UserData = {
    id: userParam as string || '1',
    name: 'ユーザー名',
    displayName: userParam as string || 'ユーザー表示名',
    bio: '自己紹介文\nここには実際のユーザーの自己紹介文が表示されます。',
    avatarUrl: 'https://source.unsplash.com/random/300x300?face',
    followersCount: 946, 
    followingCount: 973,
    isFollowed: false
  };
  
  // 新着投稿データ
  const recentPosts: PostData[] = [
    {
      id: '1',
      title: '【サンプル】最近の投稿タイトル1',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?book',
      publishedAt: '11時間前',
      views: 120,
      likes: 8,
      comments: 0
    },
    {
      id: '2',
      title: '【サンプル】最近の投稿タイトル2',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?school',
      publishedAt: '1日前',
      views: 243,
      likes: 40,
      comments: 5
    },
    {
      id: '3',
      title: '【サンプル】最近の投稿タイトル3',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?makeup',
      publishedAt: '2日前',
      views: 189,
      likes: 17,
      comments: 3
    }
  ];
  
  // 人気投稿データ
  const popularPosts: PostData[] = [
    {
      id: '4',
      title: '【サンプル】人気の投稿タイトル1',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?teacher',
      publishedAt: '3日前',
      views: 1210,
      likes: 122,
      comments: 18
    },
    {
      id: '5',
      title: '【サンプル】人気の投稿タイトル2',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?conversation',
      publishedAt: '4日前',
      views: 856,
      likes: 95,
      comments: 12
    },
    {
      id: '6',
      title: '【サンプル】人気の投稿タイトル3',
      thumbnailUrl: 'https://source.unsplash.com/random/300x200?coffee',
      publishedAt: '5日前',
      views: 778,
      likes: 89,
      comments: 14
    }
  ];
  
  // サンプルマガジンデータ（実際はAPIから取得）
  const magazines: MagazineData[] = [
    {
      id: '1',
      title: 'サンプルマガジン1',
      coverUrl: 'https://source.unsplash.com/random/300x200?english',
      articlesCount: 77
    },
    {
      id: '2',
      title: 'サンプルマガジン2',
      coverUrl: 'https://source.unsplash.com/random/300x200?child',
      articlesCount: 189
    }
  ];

  // フォロー状態を切り替える
  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    
    toast({
      title: isFollowing ? "フォローを解除しました" : "フォローしました",
      description: isFollowing 
        ? `${userData.name}さんのフォローを解除しました` 
        : `${userData.name}さんをフォローしました。新しい投稿があるとタイムラインに表示されます`,
    });
  };
  
  // アクティブなタブに基づいて投稿を表示
  const getActivePosts = () => {
    return activeTab === '新着' ? recentPosts : popularPosts;
  };
  
  // ユーザーをブロックする
  const handleBlockUser = () => {
    toast({
      title: "ユーザーをブロックしました",
      description: `${userData.name}さんをブロックしました。このユーザーからの投稿は表示されなくなります。`,
    });
  };

  // ユーザーをミュートする
  const handleMuteUser = () => {
    toast({
      title: "ユーザーをミュートしました",
      description: `${userData.name}さんをミュートしました。このユーザーからの通知は届かなくなります。`,
    });
  };

  // ユーザーを通報する
  const handleReportUser = () => {
    toast({
      title: "通報を受け付けました",
      description: "ご報告ありがとうございます。内容を確認いたします。",
    });
  };
  
  // 投稿カードをレンダリング
  const renderPostCard = (post: PostData) => (
    <article key={post.id} className="mb-6 pb-6 border-b border-gray-100">
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
          <Link href={`/posts/${post.id}`} className="block">
            <h2 className="text-base md:text-lg font-bold text-gray-800 hover:text-gray-600 mb-2 md:mb-3 line-clamp-2">
              {post.title}
            </h2>
          </Link>
          
          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
            <div className="flex items-center mr-4">
              <UnifiedAvatar
                src={userData.avatarUrl}
                displayName={userData.name}
                size="xs"
                className="mr-1.5"
              />
              <span>{userData.name}</span>
            </div>
            <span>{post.publishedAt}</span>
          </div>
          
          <div className="flex items-center gap-4 text-gray-500 text-xs md:text-sm">
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.views}</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.likes}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
  
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
                  displayName={userData.name}
                  size="xl"
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-200"
                />
              </div>
              
              {/* プロフィール情報 */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold">{userData.displayName}</h1>
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
                    <span className="font-bold">{userData.followingCount}</span>
                    <span className="ml-1 text-gray-500">フォロー</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold">{userData.followersCount}</span>
                    <span className="ml-1 text-gray-500">フォロワー</span>
                  </div>
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
                  新着
                </TabsTrigger>
                <TabsTrigger 
                  value="人気"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  人気
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
              {getActivePosts().map(renderPostCard)}
            </div>
            
            {/* サイドバー */}
            <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 order-first lg:order-last">
              {/* マガジンセクション */}
              <div className="mb-6 md:mb-8 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">マガジン</h2>
                  <Link href={`/users/${userParam}/magazines`} className="flex items-center text-gray-500 text-sm">
                    すべて見る
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {magazines.map((magazine) => (
                    <Link href={`/magazines/${magazine.id}`} key={magazine.id} className="block">
                      <div className="flex items-start">
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={magazine.coverUrl} 
                            alt={magazine.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{magazine.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            <span>{magazine.articlesCount} 本</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserPage;

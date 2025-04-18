import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  ChevronRight, Heart, MessageSquare, Eye, 
  MoreHorizontal, BookOpen, Edit, Settings, 
  Plus, Bookmark, User
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';
import ProfileEditModal from '../components/ProfileEditModal';

// Profile data type definition
interface ProfileData {
  id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  location: string;
  followers_count: number;
  following_count: number;
}

// Post data type definition
interface PostData {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_premium: boolean;
  price: number;
  author?: any; // 保存されたポストのために追加
}

// Magazine data type definition
interface MagazineData {
  id: string;
  title: string;
  cover_url: string;
  articles_count: number;
}

const UserProfilePage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [windowWidth, setWindowWidth] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [magazines, setMagazines] = useState<MagazineData[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Detect screen size
  useEffect(() => {
    // Only access window object on client side
    if (typeof window !== 'undefined') {
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      
      setLoading(true);
      
      try {
        // ユーザーがnullの場合は処理をスキップ
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio, avatar_url, location')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // フォロワー数を取得
        const { count: followersCount, error: followersError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);
        
        // フォロー数を取得
        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);
        
        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            created_at,
            view_count,
            is_premium,
            price,
            likes:likes(count),
            comments:comments(count)
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
          
        if (postsError) throw postsError;
        
        // Fetch saved/bookmarked posts
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select(`
            prompt_id,
            prompts:prompts(
              id,
              title,
              description,
              thumbnail_url,
              created_at,
              view_count,
              is_premium,
              price,
              likes:likes(count),
              comments:comments(count),
              profiles!prompts_author_id_fkey(display_name, avatar_url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (bookmarksError) throw bookmarksError;
        
        // Fetch magazines (collections of prompts)
        const { data: magazinesData, error: magazinesError } = await supabase
          .from('magazines') // Assuming there's a magazines table
          .select(`
            id,
            title,
            cover_url,
            articles_count
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
          
        // Process the data
        setProfileData({
          id: profileData.id,
          username: profileData.username || '',
          display_name: profileData.display_name || profileData.username || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url,
          location: profileData.location || '',
          followers_count: followersCount || 0,
          following_count: followingCount || 0
        });
        
        setPosts(postsData.map(post => ({
          id: post.id,
          title: post.title,
          description: post.description || '',
          thumbnail_url: post.thumbnail_url,
          created_at: formatDate(post.created_at),
          view_count: post.view_count,
          like_count: post.likes?.[0]?.count || 0,
          comment_count: post.comments?.[0]?.count || 0,
          is_premium: post.is_premium,
          price: post.price
        })));
        
        setSavedPosts(bookmarksData.map(bookmark => {
          const post = bookmark.prompts?.[0]; // 配列の最初の要素にアクセス
          if (!post) {
            // nullの代わりに空のPostDataオブジェクトを返す
            return {
              id: '',
              title: '',
              description: '',
              created_at: '',
              view_count: 0,
              like_count: 0,
              comment_count: 0,
              is_premium: false,
              price: 0
            };
          }
          
          return {
            id: post.id,
            title: post.title,
            description: post.description || '',
            thumbnail_url: post.thumbnail_url,
            created_at: formatDate(post.created_at),
            view_count: post.view_count,
            like_count: post.likes?.[0]?.count || 0,
            comment_count: post.comments?.[0]?.count || 0,
            is_premium: post.is_premium,
            price: post.price,
            author: post.profiles
          };
        }).filter(post => post.id !== '')); // 空のIDを持つオブジェクトをフィルタリング
        
        if (!magazinesError && magazinesData) {
          setMagazines(magazinesData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: "データ取得エラー",
          description: "プロフィール情報の取得に失敗しました。",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, router, toast]);
  
  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}分前`;
      }
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };
  
  // Screen size breakpoints
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  
  // Go to edit profile page
  const handleEditProfile = () => {
    // プロフィール編集モーダルを開く
    setIsEditModalOpen(true);
  };
  
  // プロフィールが更新されたときに呼ばれる関数
  const handleProfileUpdated = async () => {
    try {
      // プロフィールデータを再取得
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, location')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      // フォロワー数を取得
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user?.id);
      
      // フォロー数を取得
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user?.id);
      
      // プロフィールデータを更新
      setProfileData({
        id: updatedProfile.id,
        username: updatedProfile.username || '',
        display_name: updatedProfile.display_name || updatedProfile.username || '',
        bio: updatedProfile.bio || '',
        avatar_url: updatedProfile.avatar_url,
        location: updatedProfile.location || '',
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      });
      
      toast({
        title: "プロフィールを更新しました",
        description: "変更内容が反映されました",
      });
      
    } catch (error) {
      console.error('プロフィール再取得エラー:', error);
    }
  };
  
  // Create new post
  const handleCreatePost = () => {
    router.push('/CreatePost');
  };
  
  // Create new magazine
  const handleCreateMagazine = () => {
    router.push('/create-magazine');
  };
  
  // Render post card
  const renderPostCard = (post: PostData, isSaved = false) => (
    <article key={post.id} className="mb-6 pb-6 border-b border-gray-100">
      <div className="flex flex-col md:flex-row gap-4">
        {post.thumbnail_url && (
          <div className="md:w-40 h-40 md:h-28 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
            <img 
              src={post.thumbnail_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <Link href={`/prompts/${post.id}`} className="block">
            <h2 className="text-base md:text-lg font-bold text-gray-800 hover:text-gray-600 mb-2 md:mb-3 line-clamp-2">
              {post.title}
            </h2>
          </Link>
          
          {post.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {post.description}
            </p>
          )}
          
          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
            {isSaved && post.author && (
            <div className="flex items-center mr-4">
              <Avatar className="h-5 w-5 mr-1.5">
                  <AvatarImage src={post.author.avatar_url} />
                  <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
                <span>{post.author.display_name}</span>
            </div>
            )}
            <span>{post.created_at}</span>
            {post.is_premium && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                ¥{post.price}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-gray-500 text-xs md:text-sm">
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.view_count}</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.comment_count}</span>
            </div>
            {!isSaved && (
              <Link href={`/edit-prompt/${post.id}`} className="ml-auto text-blue-500 flex items-center">
                <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span>編集</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
  
  // Render magazine card
  const renderMagazineCard = (magazine: MagazineData) => (
    <Link href={`/magazines/${magazine.id}`} key={magazine.id} className="block">
      <div className="flex items-start mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
          <img 
            src={magazine.cover_url || '/images/magazine-placeholder.png'} 
            alt={magazine.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{magazine.title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <BookOpen className="h-3.5 w-3.5 mr-1" />
            <span>{magazine.articles_count} 本</span>
            <Link href={`/edit-magazine/${magazine.id}`} className="ml-3 text-blue-500 flex items-center">
              <Edit className="h-3 w-3 mr-1" />
              <span>編集</span>
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <p>読み込み中...</p>
        </main>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-16 flex flex-col items-center justify-center min-h-screen">
          <p className="text-lg mb-4">プロフィール情報が見つかりません</p>
          <Button onClick={() => router.push('/settings?tab=profile')}>
            プロフィールを設定する
          </Button>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className={`pt-16 ${isMobile ? 'pt-20' : ''}`}>
        {/* Profile header */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-4xl py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-full border border-gray-200">
                  <AvatarImage src={profileData.avatar_url} alt={profileData.display_name} />
                  <AvatarFallback>{profileData.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Profile info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold">{profileData.display_name}</h1>
                    <p className="text-gray-500 text-sm">
                      @{profileData.username}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <Button 
                      variant="outline"
                      className="px-4 py-2 text-sm h-9 rounded-full border-gray-300"
                      onClick={handleEditProfile}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      プロフィールを編集
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="p-2 h-9 w-9 rounded-full border-gray-300">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>アカウント設定</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Profile bio */}
                <div className="my-4">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{profileData.bio}</p>
                </div>
                
                {/* Additional info */}
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 mb-4">
                  {profileData.location && (
                    <div className="flex items-center">
                      <span>{profileData.location}</span>
                    </div>
                  )}
                </div>
                
                {/* Follow info */}
                <div className="flex justify-center md:justify-start space-x-6 text-sm">
                  <Link href={`/following/${profileData.id}`} className="flex items-center">
                    <span className="font-bold">{profileData.following_count}</span>
                    <span className="ml-1 text-gray-500">フォロー</span>
                  </Link>
                  <Link href={`/followers/${profileData.id}`} className="flex items-center">
                    <span className="font-bold">{profileData.followers_count}</span>
                    <span className="ml-1 text-gray-500">フォロワー</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs section */}
        <div className="border-b border-gray-200 sticky top-16 bg-white z-10">
          <div className="container mx-auto px-4 max-w-4xl">
            <Tabs 
              defaultValue="posts" 
              className="w-full" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-3 md:flex md:flex-row bg-transparent h-auto p-0 gap-0">
                <TabsTrigger 
                  value="posts"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  投稿
                </TabsTrigger>
                <TabsTrigger 
                  value="saved"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  保存済み
                </TabsTrigger>
                <TabsTrigger 
                  value="magazines"
                  className="px-5 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent text-sm font-medium text-gray-500 data-[state=active]:text-black"
                >
                  マガジン
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Content section */}
        <div className="container mx-auto px-4 max-w-4xl my-4 md:my-6">
          {activeTab === 'posts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">あなたの投稿</h2>
                <Button onClick={handleCreatePost} className="px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  新規投稿
                </Button>
              </div>
              
              {posts.length > 0 ? (
                posts.map(post => renderPostCard(post))
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">まだ投稿がありません</p>
                  <Button onClick={handleCreatePost} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                    最初の投稿を作成
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div>
              <h2 className="text-lg font-bold mb-6">保存した投稿</h2>
              
              {savedPosts.length > 0 ? (
                savedPosts.map(post => renderPostCard(post, true))
              ) : (
                <div className="text-center py-10">
                  <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">保存した投稿はありません</p>
                  <Button onClick={() => router.push('/')} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                    投稿を探す
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'magazines' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">あなたのマガジン</h2>
                <Button onClick={handleCreateMagazine} className="px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  新規マガジン
                </Button>
                </div>
                
              {magazines.length > 0 ? (
                <div className="space-y-4">
                  {magazines.map(renderMagazineCard)}
                        </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">まだマガジンがありません</p>
                  <Button onClick={handleCreateMagazine} className="mt-4 px-4 py-2 text-sm h-9 rounded-full bg-black hover:bg-gray-800">
                    最初のマガジンを作成
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Profile edit modal */}
        {profileData && (
          <ProfileEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            userData={profileData}
            onProfileUpdated={handleProfileUpdated}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default UserProfilePage;
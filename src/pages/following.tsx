import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, Heart, MoreVertical, Bookmark, UserPlus, Loader2, ChevronDown, Home } from 'lucide-react';
import Footer from '../components/footer';
import { PostItem, getTodayForYouPosts } from '../data/posts';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { useToast } from '../components/ui/use-toast';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { useInView } from 'react-intersection-observer';
import ReportDialog from '../components/shared/ReportDialog';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import { Badge } from '../components/ui/badge';
import { UnifiedAvatar, DEFAULT_AVATAR_URL } from '../components/index';

// ページあたりの投稿数を定義
const POSTS_PER_PAGE = 12;

// 型定義を強化
interface FollowingPostsResponse {
  posts: PostItem[];
  hasMore: boolean;
  nextCursor?: string;
}

// メモ化されたデータ取得関数 - ページネーション対応
const fetchFollowingPostsData = async (
  userId: string | undefined, 
  cursor?: string,
  limit: number = POSTS_PER_PAGE
): Promise<FollowingPostsResponse> => {
  if (!userId) return { posts: [], hasMore: false };
  
  try {
    // 1. フォローしているユーザーのIDを取得（より効率的なクエリ）
    const { data: followsData, error: followsError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
      
    if (followsError) {
      return { posts: [], hasMore: false };
    }
    
    // フォローしているユーザーがいない場合
    if (!followsData || followsData.length === 0) {
      return { posts: [], hasMore: false };
    }
    
    // フォローしているユーザーのIDリストを作成
    const followingIds = followsData.map(follow => follow.following_id);
    
    // 2. ページネーション付きでフォローしているユーザーの投稿を取得
    let query = supabase
      .from('prompts')
      .select(`
        id,
        title,
        thumbnail_url,
        created_at,
        view_count,
        author_id,
        profiles!prompts_author_id_fkey(id, username, display_name, avatar_url, bio)
      `)
      .in('author_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit + 1); // 次のページがあるかを確認するために1つ多く取得
    
    // カーソルが指定されている場合は、そこから開始
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data: postsData, error: postsError } = await query;
    
    if (postsError) {
      return { posts: [], hasMore: false };
    }
    
    if (!postsData || postsData.length === 0) {
      return { posts: [], hasMore: false };
    }
    
    // 次のページがあるかどうかを確認
    const hasMore = postsData.length > limit;
    // 表示用のデータは制限内に収める
    const displayPosts = hasMore ? postsData.slice(0, limit) : postsData;
    
    // 次のカーソル値を取得（最後の投稿の作成日）
    const nextCursor = hasMore && displayPosts.length > 0 
      ? displayPosts[displayPosts.length - 1].created_at as string
      : undefined;
    
    // 投稿IDのリストを作成
    const postIds = displayPosts.map(post => post.id);
    
    // 3. いいね情報を一括取得（いいね数といいね状態を一度に取得）
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('prompt_id, user_id')
      .in('prompt_id', postIds);
      
    if (likesError) {
    }
    
    // いいね情報をマッピング
    const likeCountMap: Record<string, number> = {};
    const likedMap: Record<string, boolean> = {};
    
    if (likesData) {
      postIds.forEach(postId => {
        const postIdStr = postId as string;
        const count = likesData.filter(like => like.prompt_id === postIdStr).length;
        likeCountMap[postIdStr] = count;
        likedMap[postIdStr] = likesData.some(like => like.prompt_id === postIdStr && like.user_id === userId);
      });
    }
    
    // 整形した投稿データを作成
    const formattedPosts = displayPosts.map(post => {
      // プロフィールデータの取得
      const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
      
      // 日付フォーマット
      const date = new Date(post.created_at as string);
      const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      
      const postId = post.id as string;
      
      return {
        id: postId,
        title: post.title as string,
        thumbnailUrl: post.thumbnail_url as string || '/images/default-thumbnail.svg',
        postedAt: formattedDate,
        likeCount: likeCountMap[postId] || 0,
        isLiked: likedMap[postId] || false,
        viewCount: post.view_count as number || 0,
        user: {
          userId: post.author_id as string,
          username: profile?.username as string,
          name: profile?.display_name as string || profile?.username as string || '不明なユーザー',
          avatarUrl: profile?.avatar_url as string || DEFAULT_AVATAR_URL,
          bio: profile?.bio as string || ''
        }
      };
    });
    
    return { 
      posts: formattedPosts,
      hasMore,
      nextCursor
    };
  } catch (error) {
    return { posts: [], hasMore: false };
  }
};

const Following: React.FC = () => {
  // データ取得
  const [followingPosts, setFollowingPosts] = useState<PostItem[]>([]);
  const [todayForYouPosts, setTodayForYouPosts] = useState<PostItem[]>(getTodayForYouPosts());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // 報告ダイアログの状態
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  
  // 無限スクロール用の参照
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });
  
  const { toast } = useToast();

  // 現在のユーザーを取得（メモ化して最適化）
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

  // 初回のフォローユーザー投稿を取得
  useEffect(() => {
    let isActive = true;
    
    const loadFollowingPosts = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      
      try {
        // 最適化されたデータ取得関数を使用
        const result = await fetchFollowingPostsData(currentUser.id);
        
        if (isActive) {
          setFollowingPosts(result.posts);
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
      loadFollowingPosts();
    }
    
    return () => {
      isActive = false;
    };
  }, [currentUser]);
  
  // 無限スクロールの監視
  useEffect(() => {
    // 画面内に入った & ローディング中でない & さらにデータがある場合
    if (inView && !isLoadingMore && hasMore) {
      loadMorePosts();
    }
  }, [inView, isLoadingMore, hasMore]);
  
  // 追加の投稿を読み込む関数
  const loadMorePosts = useCallback(async () => {
    if (!currentUser || !cursor || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const result = await fetchFollowingPostsData(currentUser.id, cursor);
      
      setFollowingPosts(prev => [...prev, ...result.posts]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentUser, cursor, isLoadingMore, hasMore]);
  
  // いいねのトグル処理（メモ化して最適化）
  const toggleLike = useCallback(async (postId: string, postList: PostItem[]) => {
    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください",
        variant: "destructive",
      });
      return postList;
    }

    // UI上ですぐに反映（楽観的更新）
    const updatedPosts = postList.map(post => {
      if (post.id === postId) {
        const isLiked = post.isLiked || false;
        const newLikeCount = isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1;
        
        return {
          ...post,
          likeCount: newLikeCount,
          isLiked: !isLiked
        };
      }
      return post;
    });
    
    // バックグラウンドでDBを更新
    try {
      const post = postList.find(p => p.id === postId);
      if (!post) return updatedPosts;
      
      if (post.isLiked) {
        // いいねを削除
        await supabase
          .from('likes')
          .delete()
          .eq('prompt_id', postId)
          .eq('user_id', currentUser.id);
      } else {
        // いいねを追加
        await supabase
          .from('likes')
          .insert({
            prompt_id: postId,
            user_id: currentUser.id,
          });
      }
    } catch (error) {
      // エラー時は元の状態に戻す処理も実装できる
    }
    
    return updatedPosts;
  }, [currentUser, toast]);
  
  // フォロー中の投稿のいいねをトグル
  const handleFollowingLike = useCallback(async (postId: string) => {
    const updatedPosts = await toggleLike(postId, followingPosts);
    setFollowingPosts(updatedPosts);
  }, [followingPosts, toggleLike]);
  
  // 「今日のあなたに」の投稿のいいねをトグル
  const handleTodayForYouLike = useCallback(async (postId: string) => {
    const updatedPosts = await toggleLike(postId, todayForYouPosts);
    setTodayForYouPosts(updatedPosts);
  }, [todayForYouPosts, toggleLike]);
  
  // 報告ダイアログを開く
  const openReportDialog = useCallback((postId: string) => {
    setSelectedPostId(postId);
    setReportDialogOpen(true);
  }, []);
  
  // 投稿を非表示にする
  const hidePost = useCallback((postId: string) => {
    // フォロー中の投稿を非表示
    setFollowingPosts(prev => prev.filter(post => post.id !== postId));
    // 今日のあなたにの投稿を非表示
    setTodayForYouPosts(prev => prev.filter(post => post.id !== postId));
    
    // ローカルストレージに保存
    try {
      const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
      if (!hiddenPosts.includes(postId)) {
        hiddenPosts.push(postId);
        localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts));
      }
    } catch (error) {
    }
    
    toast({
      title: "投稿を非表示にしました",
      description: "このコンテンツは今後表示されません",
    });
  }, [toast]);
  
  // コンテンツがない場合の表示（メモ化）
  const EmptyFollowingState = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <UserPlus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">まだフォロー中の記事がありません</h3>
      <p className="text-gray-500 max-w-md mb-6">
        興味のある著者をフォローすると、その投稿がここに表示されます。新しいコンテンツを見つけるには探索ページをチェックしてみましょう。
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
  
  // ローディング表示をメモ化
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

  // モバイル表示の記事アイテム - 個別コンポーネント化して最適化
  const MobileArticleItem = useCallback(({ post }: { post: PostItem }) => {
    // 記事詳細ページへの遷移関数
    const navigateToArticle = (articleId: string) => {
      window.location.href = `/prompts/${articleId}`;
    };

    return (
      <article 
        key={post.id} 
        className="px-4 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => navigateToArticle(post.id)}
      >
        <div className="flex">
          <div className="flex-1 pr-4 overflow-hidden">
            <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
            <div className="flex items-center mt-2.5">
              <UnifiedAvatar
                src={post.user.avatarUrl}
                displayName={post.user.name}
                size="xs"
                className="mr-1.5"
              />
              <span className="text-xs text-gray-500">{post.user.name}</span>
              <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
            </div>
            <div className="flex items-center mt-2.5">
              <button 
                className={`flex items-center mr-4 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`}
                onClick={(e) => {
                  e.stopPropagation(); // クリックイベントの伝播を防止
                  handleFollowingLike(post.id);
                }}
              >
                <Heart 
                  className={`h-[14px] w-[14px] mr-1.5 ${post.isLiked ? 'fill-red-500' : ''}`} 
                />
                <span className="text-xs">{post.likeCount}</span>
              </button>
              <button 
                className="flex items-center text-gray-400"
                onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を防止
              >
                <Bookmark className="h-[14px] w-[14px]" />
              </button>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-[104px] h-[58px] flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
              <img src={post.thumbnailUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  fetchPriority="low" 
                  onError={(e) => {
                    // 画像読み込みエラー時にデフォルト画像を表示
                    (e.target as HTMLImageElement).src = '/images/default-thumbnail.svg';
                  }}
              />
            </div>
            
            {/* 三点メニュー */}
            <div onClick={(e) => e.stopPropagation()}> {/* クリックイベントの伝播を防止 */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center p-1 ml-1 rounded-full text-gray-400 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                    報告
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => hidePost(post.id)}>
                    非表示にする
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </article>
    );
  }, [handleFollowingLike, openReportDialog, hidePost]);

  const DesktopArticleItem = useCallback(({ post }: { post: PostItem }) => (
    <div key={post.id} className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm transform transition-transform duration-200 hover:translate-y-[-3px]">
      <Link href={`/prompts/${post.id}`} className="block">
        <div className="relative pb-[56.25%]">
          <img 
            src={post.thumbnailUrl} 
            alt={post.title} 
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            fetchPriority="low"
            onError={(e) => {
              // 画像読み込みエラー時にデフォルト画像を表示
              (e.target as HTMLImageElement).src = '/images/default-thumbnail.svg';
            }}
          />
        </div>
      </Link>
      <div className="flex flex-col p-3">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/prompts/${post.id}`} className="line-clamp-2 font-medium hover:text-prompty-primary flex-1 mr-2">
            {post.title}
          </Link>
          
          {/* 三点メニュー */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center p-1 rounded-full text-gray-400 hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openReportDialog(post.id)}>
                報告
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => hidePost(post.id)}>
                非表示にする
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <Link href={`/users/${post.user.userId}`} className="block">
              <UnifiedAvatar
                src={post.user.avatarUrl}
                displayName={post.user.name}
                size="xs"
              />
            </Link>
            <Link href={`/users/${post.user.userId}`} className="text-xs text-gray-600 hover:underline">
              {post.user.name}
            </Link>
            <span className="text-xs text-gray-500">{post.postedAt}</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center text-gray-500 mt-4">
              <button 
                className={`like-button flex items-center ${post.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                onClick={() => handleFollowingLike(post.id)}
              >
                <Heart className={`mr-1 h-4 w-4 ${post.isLiked ? 'fill-red-500' : ''}`} />
              </button>
              <span className="text-xs">{post.likeCount}</span>
            </div>
            <div className="flex items-center text-gray-500 mt-4 ml-2">
              <button className="like-button flex items-center">
                <Bookmark className="mr-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [handleFollowingLike, openReportDialog, hidePost]);

  // モバイル表示の記事リストをメモ化
  const MobileArticleList = useMemo(() => (
    <div className="md:hidden divide-y divide-gray-100">
      {followingPosts.map((post) => (
        <MobileArticleItem key={post.id} post={post} />
      ))}
    </div>
  ), [followingPosts, MobileArticleItem]);

  // PC表示のグリッドレイアウトをメモ化
  const DesktopArticleGrid = useMemo(() => (
    <div className="hidden md:grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4">
      {followingPosts.map((post) => (
        <DesktopArticleItem key={post.id} post={post} />
      ))}
    </div>
  ), [followingPosts, DesktopArticleItem]);
  
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
      ) : hasMore && followingPosts.length > 0 ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadMorePosts}
          className="rounded-full px-4 py-2 border border-gray-300 shadow-sm hover:bg-gray-50"
        >
          もっと見る
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  ), [hasMore, isLoadingMore, followingPosts.length, loadMorePosts, loadMoreRef]);
  
  // ページコンテンツが読み込まれた時の処理 
  useEffect(() => {
    // ここでページのタイトルをDocumentに設定
    document.title = "フォロー中 | Prompty";
  }, []);
  
  // ブレッドクラムコンポーネント
  const Breadcrumb = () => (
    <div className="bg-gray-50 py-3 px-4 sm:px-6 md:px-8 border-b sticky top-0 z-10 md:static md:z-auto md:mt-0">
      <div className="container mx-auto flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="flex items-center hover:text-gray-900 flex-shrink-0">
          <Home size={14} className="mr-1" />
          ホーム
        </Link>
        <ChevronRight size={14} className="mx-2 flex-shrink-0" />
        <span className="font-medium text-gray-900 flex-shrink-0">フォロー中</span>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-prompty-background">
      <Head>
        <title>フォロー中 | Prompty - フォローユーザーの最新AIプロンプト</title>
        <meta name="description" content="フォローしているユーザーの最新AIプロンプトを表示します。ChatGPT、MidJourney、Stable Diffusionなど各種AIツールのプロンプトをタイムラインで確認できます。" />
        <meta name="keywords" content="フォロー,タイムライン,AIプロンプト,フォローユーザー,最新投稿,ChatGPT,MidJourney,Stable Diffusion" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://prompty-ai.com/following" />
        <meta property="og:title" content="フォロー中 | Prompty - フォローユーザーの最新AIプロンプト" />
        <meta property="og:description" content="フォローしているユーザーの最新AIプロンプトを表示します。ChatGPT、MidJourney、Stable Diffusionなど各種AIツールのプロンプトをタイムラインで確認できます。" />
        <meta property="og:image" content="https://prompty-ai.com/images/prompty_logo.jpg" />
        <meta property="og:site_name" content="Prompty" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://prompty-ai.com/following" />
        <meta name="twitter:title" content="フォロー中 | Prompty - フォローユーザーの最新AIプロンプト" />
        <meta name="twitter:description" content="フォローしているユーザーの最新AIプロンプトを表示します。" />
        <meta name="twitter:image" content="https://prompty-ai.com/images/prompty_logo.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://prompty-ai.com/following" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "フォロー中",
              "description": "フォローしているユーザーの最新AIプロンプトを表示します。",
              "url": "https://prompty-ai.com/following",
              "isPartOf": {
                "@type": "WebSite",
                "name": "Prompty",
                "url": "https://prompty-ai.com"
              }
            })
          }}
        />
      </Head>
      
      <main className="flex-1 pb-12">
        <div className="container mx-auto px-4">
          <Breadcrumb />
          {/* フォロー中のコンテンツ */}
          <div className="mt-4">
            <div className="pb-3 px-4 flex items-center">
              <h2 className="text-xl font-bold">フォロー中</h2>
              <span className="text-gray-500 ml-1">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
            
            {isLoading ? LoadingState : 
             !currentUser ? NeedLoginState : 
             followingPosts.length === 0 ? EmptyFollowingState : 
             <>
               {MobileArticleList}
               {DesktopArticleGrid}
               {LoadMoreElement}
             </>
            }
          </div>
        </div>
      </main>
      
      {/* 報告ダイアログコンポーネント */}
      <ReportDialog 
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetId={selectedPostId}
        targetType="prompt"
      />
      
      <Footer />
    </div>
  );
};

export default Following;

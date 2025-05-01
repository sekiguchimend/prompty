import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronRight, Heart, MessageSquare, MoreVertical, Bookmark, UserPlus, Loader2, ChevronDown, Flag } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import Head from 'next/head';

// 報告理由の選択肢
const REPORT_REASONS = [
  { id: 'inappropriate', label: '不適切なコンテンツ' },
  { id: 'spam', label: 'スパム・宣伝' },
  { id: 'copyright', label: '著作権侵害' },
  { id: 'offensive', label: '攻撃的・差別的' },
  { id: 'misinformation', label: '誤情報・フェイク情報' },
  { id: 'other', label: 'その他' }
];

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
      console.error('フォロー中ユーザー取得エラー:', followsError);
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
      console.error('フォロー中投稿取得エラー:', postsError);
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
      console.error('いいね取得エラー:', likesError);
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
          name: profile?.display_name as string || profile?.username as string || '不明なユーザー',
          avatarUrl: profile?.avatar_url as string || '/images/default-avatar.svg',
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
    console.error('フォロー中の投稿取得エラー:', error);
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
  const [selectedReportReasonId, setSelectedReportReasonId] = useState('');
  const [reportReason, setReportReason] = useState('');
  
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
        console.error('ユーザー取得エラー:', error);
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
        console.error('投稿取得エラー:', error);
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
      console.error('追加の投稿取得エラー:', error);
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
      console.error('いいね処理エラー:', error);
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

  // 報告ダイアログを閉じる
  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setSelectedReportReasonId('');
    setReportReason('');
    setSelectedPostId('');
  };
  
  // 報告を処理する関数
  const handleReport = () => {
    if (!selectedReportReasonId) {
      toast({
        title: "報告理由を選択してください",
        description: "報告を送信するには理由の選択が必要です。",
        variant: "destructive",
      });
      return;
    }
    
    const selectedReason = REPORT_REASONS.find(reason => reason.id === selectedReportReasonId);
    const reasonText = selectedReason ? selectedReason.label : '不明な理由';
    const detailText = reportReason.trim() ? ` (詳細: ${reportReason})` : '';
    
    // ここで実際にはAPIを呼び出して報告を送信します
    console.log(`コンテンツ報告: ID=${selectedPostId}, 理由=${reasonText}${detailText}`);
    
    setReportDialogOpen(false);
    toast({
      title: "報告を受け付けました",
      description: "ご報告ありがとうございます。内容を確認いたします。",
    });
    
    // 状態をリセット
    setSelectedReportReasonId('');
    setReportReason('');
    setSelectedPostId('');
  };
  
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
      console.error('非表示設定の保存に失敗しました', error);
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
  const MobileArticleItem = useCallback(({ post }: { post: PostItem }) => (
    <article key={post.id} className="px-4 py-5">
      <div className="flex">
        <div className="flex-1 pr-4 overflow-hidden">
          <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
          <div className="flex items-center mt-2.5">
            <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
              <img src={post.user.avatarUrl} 
                  alt={post.user.name} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  fetchPriority="low"
                  onError={(e) => {
                    // 画像読み込みエラー時にデフォルト画像を表示
                    (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                  }}
              />
            </div>
            <span className="text-xs text-gray-500">{post.user.name}</span>
            <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
          </div>
          <div className="flex items-center mt-2.5">
            <button 
              className={`flex items-center mr-4 ${post.isLiked ? 'text-red-500' : 'text-gray-400'}`}
              onClick={() => handleFollowingLike(post.id)}
            >
              <Heart 
                className={`h-[14px] w-[14px] mr-1.5 ${post.isLiked ? 'fill-red-500' : ''}`} 
              />
              <span className="text-xs">{post.likeCount}</span>
            </button>
            <button className="flex items-center text-gray-400">
              <MessageSquare className="h-[14px] w-[14px]" />
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
    </article>
  ), [handleFollowingLike, openReportDialog, hidePost]);

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
            <Link href={`/users/${post.user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
              <img 
                src={post.user.avatarUrl} 
                alt={post.user.name} 
                className="h-full w-full object-cover"
                loading="lazy"
                fetchPriority="low"
                onError={(e) => {
                  // 画像読み込みエラー時にデフォルト画像を表示
                  (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                }}
              />
            </Link>
            <Link href={`/users/${post.user.name}`} className="text-xs text-gray-600 hover:underline">
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
  
  return (
    <div className="min-h-screen bg-prompty-background">
      <Head>
        <title>フォロー中 | Prompty</title>
        <meta name="description" content="フォローしているユーザーの投稿を表示します" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      
      <main className="flex-1 pb-12 mt-20 md:mt-16">
        <div className="container mx-auto px-4">
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
      
      {/* 報告ダイアログ */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>コンテンツを報告</DialogTitle>
            <DialogDescription>
              このコンテンツを報告する理由を選択してください。すべての報告は匿名で処理されます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">報告理由</h4>
                <RadioGroup 
                  value={selectedReportReasonId} 
                  onValueChange={setSelectedReportReasonId}
                  className="space-y-2"
                >
                  {REPORT_REASONS.map((reason) => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.id} id={`reason-${reason.id}`} />
                      <Label htmlFor={`reason-${reason.id}`} className="text-sm font-normal">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">詳細情報（任意）</h4>
                <Textarea 
                  placeholder="追加の詳細情報があれば入力してください..." 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleCloseReportDialog}>
              キャンセル
            </Button>
            <Button 
              type="button" 
              onClick={handleReport} 
              disabled={!selectedReportReasonId}
            >
              報告する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Following;
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { MoreVertical, Edit, ExternalLink, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../lib/auth-context';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Eye, Heart } from 'lucide-react';
import VideoPlayer from '../common/VideoPlayer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// プロフィールの型定義
interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
}

// 記事データの型定義
interface ArticleData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
  published: boolean;
  view_count?: number;
  like_count?: number;
  bookmark_count?: number;
  price?: number;
  profiles: Profile;
}

// 自分の記事の型定義
interface MyArticle {
  id: string;
  title: string;
  published_at: string;
  is_published: boolean;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  price: number;
  thumbnail_url: string | null;
  media_type?: 'image' | 'video';
}

const MyArticlesList = () => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [myArticles, setMyArticles] = useState<MyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchMyArticles = async () => {
      if (authLoading) return; // 認証状態の確認中は何もしない
      
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 自分の記事の詳細情報を取得
        const { data: articlesData, error: articlesError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            created_at,
            published,
            price,
            view_count,
            media_type,
            profiles:author_id (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });

        if (articlesError) throw articlesError;

        if (articlesData) {
          // いいね数とブックマーク数を個別に取得
          const articlesWithCounts = await Promise.all(
            articlesData.map(async (article: any) => {
              // いいね数を取得
              const { count: likeCount } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('prompt_id', article.id);

              // ブックマーク数を取得
              const { count: bookmarkCount } = await supabase
                .from('bookmarks')
                .select('*', { count: 'exact', head: true })
                .eq('prompt_id', article.id);

              return {
                id: article.id,
                title: article.title,
                published_at: article.created_at,
                is_published: article.published,
                view_count: article.view_count || 0,
                like_count: likeCount || 0,
                bookmark_count: bookmarkCount || 0,
                price: article.price || 0,
                thumbnail_url: article.thumbnail_url,
                media_type: article.media_type || 'image'
              };
            })
          );

          setMyArticles(articlesWithCounts);
        } else {
          setMyArticles([]);
        }
      } catch (error) {
        console.error('自分の記事取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchMyArticles();
  }, [user, authLoading]);

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 価格をフォーマットする関数
  const formatPrice = (price: number) => {
    if (price === 0) return '無料';
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY'
    }).format(price);
  };

  // 記事詳細ページへの遷移関数
  const navigateToArticle = (articleId: string) => {
    window.location.href = `/prompts/${articleId}`;
  };

  // 記事編集ページへの遷移関数
  const navigateToEdit = (articleId: string) => {
    window.location.href = `/edit-prompt/${articleId}`;
  };

  // バックエンドAPI経由での記事削除関数
  const handleDeleteArticle = async (articleId: string) => {
    if (!user || !session) {
      alert('ログインが必要です。再度ログインしてください。');
      return;
    }
    
    setDeleting(true);
    try {
      console.log('削除開始:', { articleId, userId: user.id, sessionExists: !!session });
      
      // セッションから認証トークンを取得
      const token = session.access_token;
      
      if (!token) {
        alert('認証トークンが見つかりません。再度ログインしてください。');
        return;
      }

      console.log('APIコール開始:', `/api/prompts/${articleId}`);
      
      // バックエンドAPIを呼び出して削除
      const response = await fetch(`/api/prompts/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API レスポンス:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('削除APIエラー:', errorData);
        throw new Error(errorData.error || `削除に失敗しました (${response.status})`);
      }

      const result = await response.json();
      console.log('削除結果:', result);
      
      if (result.success) {
        // UIから削除
        setMyArticles(prev => prev.filter(article => article.id !== articleId));
        alert('記事が削除されました。');
      } else {
        throw new Error(result.error || '削除に失敗しました');
      }
      
    } catch (error) {
      console.error('削除処理エラー:', error);
      alert(error instanceof Error ? error.message : '記事の削除に失敗しました。後でもう一度お試しください。');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  // 削除確認ダイアログを開く
  const openDeleteDialog = (articleId: string) => {
    setArticleToDelete(articleId);
    setDeleteDialogOpen(true);
  };

  // ローディング状態
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          再試行
        </button>
      </div>
    );
  }

  // 記事がない場合
  if (myArticles.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ記事がありません</h3>
        <p className="text-gray-600 mb-6">最初の記事を作成して、あなたのアイデアを共有しましょう！</p>
        <Button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => window.location.href = '/create-post'}
        >
          新しい記事を投稿
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{myArticles.length} 件の記事</h2>
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          期間 ▼
        </button>
      </div>
      
      {/* 記事リスト */}
      <div className="space-y-4">
        {myArticles.map((article) => (
          <div 
            key={article.id} 
            className="relative hover:bg-gray-50 transition-colors rounded-lg p-3"
          >
            {/* スマホ版レイアウト */}
            <div className="block sm:hidden">
              <div 
                className="cursor-pointer"
                onClick={() => navigateToArticle(article.id)}
              >
                {/* ヘッダー部分 */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug pr-2 flex-1">
                    {article.title}
                  </h3>
                  {/* 三点メニュー - スマホ版 */}
                  <div className="flex-shrink-0 ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                          aria-label="記事メニュー"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToArticle(article.id);
                          }}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          詳細を見る
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToEdit(article.id);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          編集する
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(article.id);
                          }}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除する
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* コンテンツ部分 */}
                <div className="flex gap-3">
                  {/* サムネイル */}
                  <div className="flex-shrink-0">
                    {article.thumbnail_url ? (
                      <div className="relative w-16 h-12 rounded-md overflow-hidden">
                        {article.media_type === 'video' ? (
                          <VideoPlayer
                            src={article.thumbnail_url}
                            alt={article.title}
                            className="w-full h-full"
                            hoverToPlay={false}
                            tapToPlay={false}
                            muted={true}
                            loop={false}
                            showThumbnail={true}
                            minimumOverlay={true}
                          />
                        ) : (
                          <Image 
                            src={article.thumbnail_url}
                            alt={article.title}
                            fill
                            sizes="64px"
                            style={{ objectFit: 'cover' }}
                            className="w-full h-full"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* メタ情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {article.is_published ? '公開中' : '下書き'}
                      </span>
                      <span className="font-semibold text-blue-600 text-sm">
                        {formatPrice(article.price)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {formatDate(article.published_at)}
                      </span>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="h-3 w-3" />
                          {article.like_count}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {article.bookmark_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* デスクトップ版レイアウト */}
            <div className="hidden sm:block">
              <div 
                className="flex items-start gap-4 cursor-pointer"
                onClick={() => navigateToArticle(article.id)}
              >
                {/* サムネイル */}
                <div className="flex-shrink-0">
                  {article.thumbnail_url ? (
                    <div className="relative w-24 h-16 rounded-md overflow-hidden">
                      {article.media_type === 'video' ? (
                        <VideoPlayer
                          src={article.thumbnail_url}
                          alt={article.title}
                          className="w-full h-full"
                          hoverToPlay={false}
                          tapToPlay={false}
                          muted={true}
                          loop={false}
                          showThumbnail={true}
                          minimumOverlay={true}
                        />
                      ) : (
                        <Image 
                          src={article.thumbnail_url}
                          alt={article.title}
                          fill
                          sizes="96px"
                          style={{ objectFit: 'cover' }}
                          className="w-full h-full"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* コンテンツエリア */}
                <div className="flex-1 min-w-0">
                  {/* タイトル行 */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-snug flex-1 pr-3">
                      {article.title}
                    </h3>
                  </div>
                  
                  {/* ステータスと日時情報 */}
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {article.is_published ? '公開中' : '下書き'}
                      </span>
                      <span className="font-semibold text-blue-600 text-sm">
                        {formatPrice(article.price)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {formatDate(article.published_at)}
                      </span>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.view_count}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <Heart className="h-4 w-4" />
                          {article.like_count}
                        </span>
                        <span className="flex items-center gap-1 text-blue-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {article.bookmark_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* デスクトップ三点メニュー（右上に絶対配置） */}
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="記事メニュー"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToArticle(article.id);
                      }}
                      className="cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      詳細を見る
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToEdit(article.id);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集する
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(article.id);
                      }}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除する
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消すことができません。記事とそれに関連するコメント、いいね、ブックマークがすべて削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => articleToDelete && handleDeleteArticle(articleToDelete)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? '削除中...' : '削除する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyArticlesList; 
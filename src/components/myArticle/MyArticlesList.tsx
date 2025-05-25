import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../lib/auth-context';
import Image from 'next/image';
import { Button } from '../ui/button';

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
}

const MyArticlesList = () => {
  const { user } = useAuth();
  const [myArticles, setMyArticles] = useState<MyArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyArticles = async () => {
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
                thumbnail_url: article.thumbnail_url
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
  }, [user]);

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

  return (
    <div className="my-articles-list">
      {/* スマホ用レイアウト */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              再試行
            </button>
          </div>
        ) : myArticles.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{myArticles.length} 件の記事</h2>
            </div>
            {myArticles.map((article) => (
              <div 
                key={article.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                onClick={() => navigateToArticle(article.id)}
              >
                {/* サムネイル */}
                {article.thumbnail_url && (
                  <div className="relative h-48 w-full">
                    <Image 
                      src={article.thumbnail_url}
                      alt={article.title}
                      fill
                      sizes="100vw"
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        article.is_published 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {article.is_published ? '公開中' : '下書き'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* コンテンツ */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{formatDate(article.published_at)}</span>
                    <span className="font-semibold text-blue-600">{formatPrice(article.price)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        👀 {article.view_count}
                      </span>
                      <span className="flex items-center text-red-500">
                        ❤️ {article.like_count}
                      </span>
                      <span className="flex items-center text-blue-500">
                        🔖 {article.bookmark_count}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateToEdit(article.id);
                      }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      aria-label="記事を編集"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ記事がありません</h3>
            <p className="text-gray-600 mb-6">最初の記事を作成して、あなたのアイデアを共有しましょう！</p>
            <Button 
              className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => window.location.href = '/create-post'}
            >
              新しい記事を投稿
            </Button>
          </div>
        )}
      </div>

      {/* デスクトップ用レイアウト（既存） */}
      <div className="hidden md:block articles-container">
        <div className="articles-header">
          <h2>{myArticles.length} 記事</h2>
          <div className="filter-controls">
            <div className="period-dropdown">
              <button>期間 <span>▼</span></button>
            </div>
          </div>
        </div>
        
        <div className="articles-list">
          {loading ? (
            <p className="text-center py-6">読み込み中...</p>
          ) : error ? (
            <p className="text-center py-6 text-red-500">{error}</p>
          ) : myArticles.length > 0 ? (
            myArticles.map((article) => (
              <div 
                key={article.id} 
                className="article-item cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigateToArticle(article.id)}
              >
                <div className="article-content">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="flex-1 mr-2">{article.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${
                      article.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {article.is_published ? '公開中' : '下書き'}
                    </span>
                  </div>
                  <div className="article-meta">
                    <span className="date">{formatDate(article.published_at)}</span>
                    <span className="price">{formatPrice(article.price)}</span>
                  </div>
                  <div className="article-stats mt-2 flex items-center space-x-4">
                    <div className="flex items-center text-gray-500">
                      <span className="text-xs">{article.view_count} 閲覧</span>
                    </div>
                    <div className="flex items-center text-red-500">
                      <span className="text-xs">{article.like_count} いいね</span>
                    </div>
                    <div className="flex items-center text-blue-500">
                      <span className="text-xs">{article.bookmark_count} ブックマーク</span>
                    </div>
                  </div>
                </div>
                {article.thumbnail_url && (
                  <div className="article-thumbnail">
                    <Image 
                      src={article.thumbnail_url}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 64px"
                      style={{ objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  </div>
                )}
                <button 
                  className="more-options"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 編集ページに遷移
                    navigateToEdit(article.id);
                  }}
                  aria-label="記事のオプション"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">まだ記事がありません</p>
              <Button 
                className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                onClick={() => window.location.href = '/create-post'}
              >
                新しい記事を投稿
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyArticlesList; 
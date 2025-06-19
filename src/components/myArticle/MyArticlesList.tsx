import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../lib/auth-context';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Eye, Heart } from 'lucide-react';

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
    <div className="p-4 md:p-6">
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
        </div>
      ) : myArticles.length > 0 ? (
        <div>
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{myArticles.length} 件の記事</h2>
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              期間 ▼
            </button>
          </div>
          
          {/* 記事リスト */}
          <div className="space-y-3 md:space-y-4">
            {myArticles.map((article) => (
              <div 
                key={article.id} 
                className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigateToArticle(article.id)}
              >
                {/* サムネイル */}
                <div className="flex-shrink-0">
                  {article.thumbnail_url ? (
                    <div className="relative w-16 h-12 md:w-24 md:h-16 rounded-md overflow-hidden">
                      {article.media_type === 'video' ? (
                        <div className="w-full h-full relative">
                          <video
                            src={article.thumbnail_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                            poster=""
                          />
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            動画
                          </div>
                        </div>
                      ) : (
                        <Image 
                          src={article.thumbnail_url}
                          alt={article.title}
                          fill
                          sizes="(max-width: 768px) 64px, 96px"
                          style={{ objectFit: 'cover' }}
                          className="w-full h-full"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-12 md:w-24 md:h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <FileText className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug pr-2">
                      {article.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      article.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {article.is_published ? '公開中' : '下書き'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                      <span>{formatDate(article.published_at)}</span>
                      <span className="font-semibold text-blue-600">{formatPrice(article.price)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        {article.view_count}
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <Heart className="h-3 w-3 md:h-4 md:w-4" />
                        {article.like_count}
                      </span>
                      <span className="flex items-center gap-1 text-blue-500">
                        <svg className="h-3 w-3 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {article.bookmark_count}
                      </span>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigateToEdit(article.id);
                        }}
                        className="p-1 md:p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                        aria-label="記事を編集"
                      >
                        <MoreVertical className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default MyArticlesList; 
// components/LikedArticles.tsx
import React, { useState, useEffect } from 'react';
import { Heart, MoreVertical } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../lib/auth-context';
import Image from 'next/image';

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
  profiles: Profile;
}

// いいね記事の型定義
interface LikedArticle {
  id: string;
  title: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  published_at: string;
  like_count: number;
  thumbnail_url: string | null;
}

const LikedArticles = () => {
  const { user } = useAuth();
  const [likedArticles, setLikedArticles] = useState<LikedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedArticles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // いいねした記事のIDを取得
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('prompt_id')
          .eq('user_id', user.id);

        if (likesError) throw likesError;

        if (likesData && likesData.length > 0) {
          // いいねした記事のIDをリストにする
          const promptIds = likesData.map(like => like.prompt_id);

          // いいねした記事の詳細情報を取得
          const { data: articlesData, error: articlesError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              thumbnail_url,
              created_at,
              profiles:author_id (
                id,
                display_name,
                avatar_url
              )
            `)
            .in('id', promptIds)
            .eq('published', true);

          if (articlesError) throw articlesError;

          // いいね数を取得
          const likedArticlesWithCounts = await Promise.all(
            articlesData.map(async (article: any) => {
              const { count, error: countError } = await supabase
                .from('likes')
                .select('id', { count: 'exact' })
                .eq('prompt_id', article.id);

              if (countError) {
                console.error('いいね数取得エラー:', countError);
                return {
                  id: article.id,
                  title: article.title,
                  author: {
                    id: article.profiles.id,
                    display_name: article.profiles.display_name,
                    avatar_url: article.profiles.avatar_url
                  },
                  published_at: article.created_at,
                  like_count: 0,
                  thumbnail_url: article.thumbnail_url
                };
              }

              return {
                id: article.id,
                title: article.title,
                author: {
                  id: article.profiles.id,
                  display_name: article.profiles.display_name,
                  avatar_url: article.profiles.avatar_url
                },
                published_at: article.created_at,
                like_count: count || 0,
                thumbnail_url: article.thumbnail_url
              };
            })
          );

          setLikedArticles(likedArticlesWithCounts);
        } else {
          setLikedArticles([]);
        }
      } catch (error) {
        console.error('いいね記事取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchLikedArticles();
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

  // 記事詳細ページへの遷移関数
  const navigateToArticle = (articleId: string) => {
    window.location.href = `/prompts/${articleId}`;
  };

  return (
    <div className="liked-articles">
      <div className="articles-container">
        <div className="articles-header">
          <h2>{likedArticles.length} 記事</h2>
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
          ) : likedArticles.length > 0 ? (
            likedArticles.map((article) => (
              <div 
                key={article.id} 
                className="article-item cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigateToArticle(article.id)}
              >
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <div className="article-meta">
                    <span>{article.author.display_name}</span>
                    <span className="date">{formatDate(article.published_at)}</span>
                  </div>
                  <div className="article-actions mt-2 flex items-center">
                    <div className="flex items-center text-red-500 mr-3">
                      <Heart className="h-4 w-4 mr-1 fill-red-500" />
                      <span className="text-xs">{article.like_count}</span>
                    </div>
                  </div>
                </div>
                {article.thumbnail_url && (
                  <div className="article-thumbnail relative h-16 w-16">
                    <Image 
                      src={article.thumbnail_url}
                      alt={article.title}
                      fill
                      sizes="64px"
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
                    // ここに追加メニューの処理を実装
                    console.log('More options clicked for:', article.id);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state p-6 text-center">
              <p className="text-gray-500">表示するいいね記事はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikedArticles;







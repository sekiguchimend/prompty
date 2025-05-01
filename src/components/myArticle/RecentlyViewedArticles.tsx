// components/RecentlyViewedArticles.tsx
import React, { useState, useEffect } from 'react';
import { Clock, MoreVertical } from 'lucide-react';
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

// 最近見た記事の型定義
interface ViewedArticle {
  id: string;
  title: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  published_at: string;
  viewed_at: string;
  thumbnail_url: string | null;
}

const RecentlyViewedArticles = () => {
  const { user } = useAuth();
  const [viewedArticles, setViewedArticles] = useState<ViewedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentlyViewedArticles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 最近見た記事の履歴を取得
        const { data: viewsData, error: viewsError } = await supabase
          .from('prompt_views')
          .select('prompt_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10); // 最近見た10件を取得

        if (viewsError) throw viewsError;

        if (viewsData && viewsData.length > 0) {
          // 最近見た記事のIDをリストにする
          const promptIds = viewsData.map(view => view.prompt_id);

          // 最近見た記事の詳細情報を取得
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

          // 閲覧日時と合わせた記事データを作成
          const viewedArticlesWithDetails = articlesData.map((article: any) => {
            // 閲覧日時を取得
            const view = viewsData.find(v => v.prompt_id === article.id);
            const viewedAt = view ? view.created_at : '';

            return {
              id: article.id,
              title: article.title,
              author: {
                id: article.profiles.id,
                display_name: article.profiles.display_name,
                avatar_url: article.profiles.avatar_url
              },
              published_at: article.created_at,
              viewed_at: viewedAt,
              thumbnail_url: article.thumbnail_url
            };
          });

          // 閲覧日時の新しい順にソート
          const sortedArticles = viewedArticlesWithDetails.sort((a, b) => 
            new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
          );

          setViewedArticles(sortedArticles);
        } else {
          setViewedArticles([]);
        }
      } catch (error) {
        console.error('最近見た記事取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewedArticles();
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

  // 閲覧日時のフォーマット関数
  const formatViewedDate = (dateString: string) => {
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
      return formatDate(dateString);
    }
  };

  return (
    <div className="recently-viewed-articles">
      <div className="articles-container">
        <div className="articles-header">
          <h2>{viewedArticles.length} 記事</h2>
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
          ) : viewedArticles.length > 0 ? (
            viewedArticles.map((article) => (
              <div key={article.id} className="article-item">
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <div className="article-meta">
                    <span>{article.author.display_name}</span>
                    <span className="date">{formatDate(article.published_at)}</span>
                  </div>
                  <div className="article-actions mt-2 flex items-center">
                    <button className="flex items-center text-gray-500 mr-3">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-xs">{formatViewedDate(article.viewed_at)}</span>
                    </button>
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
                <button className="more-options">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state p-6 text-center">
              <p className="text-gray-500">表示する最近見た記事はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentlyViewedArticles;
// components/BookmarkedArticles.tsx
import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
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

// ブックマーク記事の型定義
interface BookmarkedArticle {
  id: string;
  title: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  published_at: string;
  bookmark_count: number;
  thumbnail_url: string | null;
}

const BookmarkedArticles = () => {
  const { user } = useAuth();
  const [bookmarkedArticles, setBookmarkedArticles] = useState<BookmarkedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarkedArticles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // ブックマークした記事のIDを取得
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('prompt_id')
          .eq('user_id', user.id);

        if (bookmarksError) throw bookmarksError;

        if (bookmarksData && bookmarksData.length > 0) {
          // ブックマークした記事のIDをリストにする
          const promptIds = bookmarksData.map(bookmark => bookmark.prompt_id);

          // ブックマークした記事の詳細情報を取得
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
              ),
              bookmarks(count)
            `)
            .in('id', promptIds)
            .eq('published', true);

          if (articlesError) throw articlesError;

          // ブックマーク数を一括取得したデータから利用
          const bookmarkedArticlesWithCounts = articlesData.map((article: any) => ({
            id: article.id,
            title: article.title,
            author: {
              id: article.profiles.id,
              display_name: article.profiles.display_name,
              avatar_url: article.profiles.avatar_url
            },
            published_at: article.created_at,
            bookmark_count: Array.isArray(article.bookmarks) && article.bookmarks.length > 0 ? (article.bookmarks[0].count as number) || 0 : 0,
            thumbnail_url: article.thumbnail_url
          }));

          setBookmarkedArticles(bookmarkedArticlesWithCounts);
        } else {
          setBookmarkedArticles([]);
        }
      } catch (error) {
        console.error('ブックマーク記事取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedArticles();
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
    <div className="bookmarked-articles">
      <div className="articles-container">
        <div className="articles-header">
          <h2>{bookmarkedArticles.length} 記事</h2>
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
          ) : bookmarkedArticles.length > 0 ? (
            bookmarkedArticles.map((article) => (
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
                    <div className="flex items-center text-blue-500 mr-3">
                      <Bookmark className="h-4 w-4 mr-1 fill-blue-500" />
                      <span className="text-xs">{article.bookmark_count}</span>
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
              <p className="text-gray-500">表示するブックマーク記事はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkedArticles;

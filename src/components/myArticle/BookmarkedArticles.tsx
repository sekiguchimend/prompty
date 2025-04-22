// components/BookmarkedArticles.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 記事の型定義
interface BookmarkedArticle {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  likeCount: number;
}

const BookmarkedArticles = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<BookmarkedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ブックマークした記事を取得する関数
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
          const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              description,
              thumbnail_url,
              created_at,
              profiles:author_id (
                id,
                display_name,
                username,
                avatar_url
              )
            `)
            .in('id', promptIds)
            .eq('published', true);

          if (promptsError) throw promptsError;

          // いいね数を取得
          const bookmarkedArticlesWithCounts = await Promise.all(
            promptsData.map(async (prompt: any) => {
              const { count, error: countError } = await supabase
                .from('likes')
                .select('id', { count: 'exact' })
                .eq('prompt_id', prompt.id);

              if (countError) {
                console.error('いいね数取得エラー:', countError);
                return {
                  id: prompt.id,
                  title: prompt.title,
                  description: prompt.description,
                  thumbnailUrl: prompt.thumbnail_url,
                  createdAt: prompt.created_at,
                  author: {
                    id: prompt.profiles.id,
                    name: prompt.profiles.display_name,
                    username: prompt.profiles.username,
                    avatarUrl: prompt.profiles.avatar_url
                  },
                  likeCount: 0
                };
              }

              return {
                id: prompt.id,
                title: prompt.title,
                description: prompt.description,
                thumbnailUrl: prompt.thumbnail_url,
                createdAt: prompt.created_at,
                author: {
                  id: prompt.profiles.id,
                  name: prompt.profiles.display_name,
                  username: prompt.profiles.username,
                  avatarUrl: prompt.profiles.avatar_url
                },
                likeCount: count || 0
              };
            })
          );

          setArticles(bookmarkedArticlesWithCounts);
        } else {
          setArticles([]);
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

  // 日付をフォーマットする関数
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

  if (loading) {
    return (
      <div className="bookmarked-articles">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ブックマークした記事</h2>
        </div>
        <div className="articles-list">
          <p className="text-center py-6">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookmarked-articles">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ブックマークした記事</h2>
        </div>
        <div className="articles-list">
          <p className="text-center py-6 text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmarked-articles">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">ブックマークした記事</h2>
      </div>
      <div className="articles-list">
        {articles.length > 0 ? (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div key={article.id} className="article-item border-b pb-4">
                <Link href={`/prompts/${article.id}`} className="flex gap-4">
                  {article.thumbnailUrl && (
                    <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded">
                      <Image 
                        src={article.thumbnailUrl} 
                        alt={article.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg hover:text-blue-600">{article.title}</h3>
                    {article.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{article.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <div className="flex items-center mr-3">
                        <Image 
                          src={article.author.avatarUrl} 
                          alt={article.author.name}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full mr-1"
                        />
                        <span>{article.author.name}</span>
                      </div>
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <div className="flex items-center mr-3">
                        <Heart className="w-3.5 h-3.5 mr-1" />
                        <span>{article.likeCount}</span>
                      </div>
                      <div className="flex items-center text-blue-500">
                        <Bookmark className="w-3.5 h-3.5 mr-1 fill-blue-500" />
                        <span>保存済み</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state p-6 text-center">
            <p className="text-gray-500">ブックマークした記事はありません</p>
            <div className="mt-2">
              <button 
                onClick={() => router.push('/')}
                className="text-blue-500 hover:underline"
              >
                記事を探す
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkedArticles;

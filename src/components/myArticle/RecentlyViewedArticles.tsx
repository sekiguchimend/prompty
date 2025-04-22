// components/RecentlyViewedArticles.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Heart } from 'lucide-react';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 最近見た記事の型定義
interface ViewedArticle {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  likeCount: number;
}

const RecentlyViewedArticles = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<ViewedArticle[]>([]);
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
        // 最近見た記事の履歴を取得（仮想テーブル）
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
          const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              thumbnail_url,
              profiles:author_id (
                id,
                display_name,
                avatar_url
              )
            `)
            .in('id', promptIds)
            .eq('published', true);

          if (promptsError) throw promptsError;

          // いいね数を取得し、閲覧日時と合わせた記事データを作成
          const viewedArticlesWithDetails = await Promise.all(
            promptsData.map(async (prompt: any) => {
              // 閲覧日時を取得
              const view = viewsData.find(v => v.prompt_id === prompt.id);
              const viewedAt = view ? view.created_at : '';

              // いいね数を取得
              const { count, error: countError } = await supabase
                .from('likes')
                .select('id', { count: 'exact' })
                .eq('prompt_id', prompt.id);

              if (countError) {
                console.error('いいね数取得エラー:', countError);
                return {
                  id: prompt.id,
                  title: prompt.title,
                  thumbnailUrl: prompt.thumbnail_url,
                  viewedAt: viewedAt,
                  author: {
                    id: prompt.profiles.id,
                    name: prompt.profiles.display_name,
                    avatarUrl: prompt.profiles.avatar_url
                  },
                  likeCount: 0
                };
              }

              return {
                id: prompt.id,
                title: prompt.title,
                thumbnailUrl: prompt.thumbnail_url,
                viewedAt: viewedAt,
                author: {
                  id: prompt.profiles.id,
                  name: prompt.profiles.display_name,
                  avatarUrl: prompt.profiles.avatar_url
                },
                likeCount: count || 0
              };
            })
          );

          // 閲覧日時の新しい順にソート
          const sortedArticles = viewedArticlesWithDetails.sort((a, b) => 
            new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
          );

          setArticles(sortedArticles);
        } else {
          setArticles([]);
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

  return (
    <div className="recently-viewed-articles">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">最近見た記事</h2>
      </div>
      <div className="articles-list">
        {loading ? (
          <p className="text-center py-6">読み込み中...</p>
        ) : error ? (
          <p className="text-center py-6 text-red-500">{error}</p>
        ) : articles.length > 0 ? (
          <div className="grid gap-4">
            {articles.map((article) => (
              <div key={article.id} className="article-item border-b pb-4">
                <Link href={`/prompts/${article.id}`} className="flex gap-4">
                  {article.thumbnailUrl ? (
                    <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded">
                      <Image 
                        src={article.thumbnailUrl} 
                        alt={article.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
                      <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg hover:text-blue-600">{article.title}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <div className="flex items-center mr-3">
                        {article.author.avatarUrl ? (
                          <Image 
                            src={article.author.avatarUrl} 
                            alt={article.author.name}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full mr-1"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 rounded-full mr-1"></div>
                        )}
                        <span>{article.author.name}</span>
                      </div>
                      <span>{formatDate(article.viewedAt)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <div className="flex items-center mr-3">
                        <Heart className="w-3.5 h-3.5 mr-1" />
                        <span>{article.likeCount}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>閲覧済み</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state p-6 text-center">
            <p className="text-gray-500">表示する最近見た記事はありません</p>
            <div className="mt-2">
              <Link href="/" className="text-blue-500 hover:underline">
                記事を探す
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyViewedArticles;
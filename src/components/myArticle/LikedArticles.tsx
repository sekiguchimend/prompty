// components/LikedArticles.tsx
import React, { useState, useEffect } from 'react';
import { Heart, FileText } from 'lucide-react';
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
              ),
              likes(count)
            `)
            .in('id', promptIds)
            .eq('published', true);

          if (articlesError) throw articlesError;

          // いいね数を一括取得したデータから利用
          const likedArticlesWithCounts = articlesData.map((article: any) => ({
            id: article.id,
            title: article.title,
            author: {
              id: article.profiles.id,
              display_name: article.profiles.display_name,
              avatar_url: article.profiles.avatar_url
            },
            published_at: article.created_at,
            like_count: Array.isArray(article.likes) && article.likes.length > 0 ? (article.likes[0].count as number) || 0 : 0,
            thumbnail_url: article.thumbnail_url
          }));

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
      ) : likedArticles.length > 0 ? (
        <div>
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{likedArticles.length} 件のいいね記事</h2>
          </div>
          
          {/* 記事リスト */}
          <div className="space-y-3 md:space-y-4">
            {likedArticles.map((article) => (
              <div 
                key={article.id} 
                className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigateToArticle(article.id)}
              >
                {/* サムネイル */}
                <div className="flex-shrink-0">
                  {article.thumbnail_url ? (
                    <div className="relative w-16 h-12 md:w-24 md:h-16 rounded-md overflow-hidden">
                      <Image 
                        src={article.thumbnail_url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 64px, 96px"
                        style={{ objectFit: 'cover' }}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 md:w-24 md:h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <FileText className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* コンテンツ */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">
                    {article.title}
                  </h3>
                  
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                      <span>by {article.author.display_name}</span>
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-red-500">
                      <Heart className="h-3 w-3 md:h-4 md:w-4 fill-red-500" />
                      <span className="text-xs md:text-sm font-medium">{article.like_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">まだいいねした記事がありません</h3>
          <p className="text-gray-600 mb-6">気に入った記事にいいねをして、ここに表示させましょう！</p>
        </div>
      )}
    </div>
  );
};

export default LikedArticles;







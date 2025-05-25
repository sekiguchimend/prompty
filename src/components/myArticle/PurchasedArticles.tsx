// components/PurchasedArticles.tsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
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
  price: number;
  profiles: Profile;
}

// 購入記事の型定義
interface PurchasedArticle {
  id: string;
  title: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  published_at: string;
  purchased_at: string;
  price: number;
  thumbnail_url: string | null;
}

const PurchasedArticles = () => {
  const { user } = useAuth();
  const [purchasedArticles, setPurchasedArticles] = useState<PurchasedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchasedArticles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 購入した記事のIDと購入日時を取得
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select('prompt_id, created_at')
          .eq('buyer_id', user.id)
          .eq('status', 'completed');

        if (purchasesError) throw purchasesError;

        if (purchasesData && purchasesData.length > 0) {
          // 購入した記事のIDをリストにする
          const promptIds = purchasesData.map(purchase => purchase.prompt_id);

          // 購入した記事の詳細情報を取得
          const { data: articlesData, error: articlesError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              thumbnail_url,
              created_at,
              price,
              profiles:author_id (
                id,
                display_name,
                avatar_url
              )
            `)
            .in('id', promptIds);

          if (articlesError) throw articlesError;

          // 購入日時と合わせた記事データを作成
          const purchasedArticlesWithDetails = articlesData.map((article: any) => {
            // 購入日時を取得
            const purchase = purchasesData.find(p => p.prompt_id === article.id);
            const purchasedAt = purchase ? purchase.created_at : '';

            return {
              id: article.id,
              title: article.title,
              author: {
                id: article.profiles.id,
                display_name: article.profiles.display_name,
                avatar_url: article.profiles.avatar_url
              },
              published_at: article.created_at,
              purchased_at: purchasedAt,
              price: article.price,
              thumbnail_url: article.thumbnail_url
            };
          });

          // 購入日時の新しい順にソート
          const sortedArticles = purchasedArticlesWithDetails.sort((a, b) => 
            new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
          );

          setPurchasedArticles(sortedArticles);
        } else {
          setPurchasedArticles([]);
        }
      } catch (error) {
        console.error('購入記事取得エラー:', error);
        setError('記事の読み込みに失敗しました。後でもう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedArticles();
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
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY'
    }).format(price);
  };

  // 記事詳細ページへの遷移関数
  const navigateToArticle = (articleId: string) => {
    window.location.href = `/prompts/${articleId}`;
  };

  return (
    <div className="purchased-articles">
      <div className="articles-container">
        <div className="articles-header">
          <h2>{purchasedArticles.length} 記事</h2>
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
          ) : purchasedArticles.length > 0 ? (
            purchasedArticles.map((article) => (
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
                    <div className="flex items-center text-amber-500 mr-3">
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      <span className="text-xs">{formatPrice(article.price)}</span>
                    </div>
                    <span className="text-xs text-gray-500">購入日: {formatDate(article.purchased_at)}</span>
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
              <p className="text-gray-500">表示する購入記事はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchasedArticles;





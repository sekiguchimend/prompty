// components/PurchasedArticles.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 購入記事の型定義
interface PurchasedArticle {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  purchasedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  likeCount: number;
}

const PurchasedArticles = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<PurchasedArticle[]>([]);
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
          const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              description,
              thumbnail_url,
              price,
              profiles:author_id (
                id,
                display_name,
                avatar_url
              )
            `)
            .in('id', promptIds);

          if (promptsError) throw promptsError;

          // いいね数を取得して、購入日時と合わせた記事データを作成
          const purchasedArticlesWithDetails = await Promise.all(
            promptsData.map(async (prompt: any) => {
              // 購入日時を取得
              const purchase = purchasesData.find(p => p.prompt_id === prompt.id);
              const purchasedAt = purchase ? purchase.created_at : '';

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
                  description: prompt.description,
                  thumbnailUrl: prompt.thumbnail_url,
                  price: prompt.price,
                  purchasedAt: purchasedAt,
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
                description: prompt.description,
                thumbnailUrl: prompt.thumbnail_url,
                price: prompt.price,
                purchasedAt: purchasedAt,
                author: {
                  id: prompt.profiles.id,
                  name: prompt.profiles.display_name,
                  avatarUrl: prompt.profiles.avatar_url
                },
                likeCount: count || 0
              };
            })
          );

          // 購入日時の新しい順にソート
          const sortedArticles = purchasedArticlesWithDetails.sort((a, b) => 
            new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
          );

          setArticles(sortedArticles);
        } else {
          setArticles([]);
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

  // 日付をフォーマットする関数
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

  return (
    <div className="purchased-articles">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">購入した記事</h2>
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
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-lg hover:text-blue-600">{article.title}</h3>
                    {article.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{article.description}</p>
                    )}
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
                      <span className="mr-3">{formatDate(article.purchasedAt)}</span>
                      <span className="font-medium text-green-600">{formatPrice(article.price)}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <div className="flex items-center mr-3">
                        <Heart className="w-3.5 h-3.5 mr-1" />
                        <span>{article.likeCount}</span>
                      </div>
                      <div className="flex items-center text-indigo-500">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        <span>購入済み</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state p-6 text-center">
            <p className="text-gray-500">表示する購入記事はありません</p>
            <div className="mt-2">
              <button 
                onClick={() => window.location.href = '/market'}
                className="text-blue-500 hover:underline"
              >
                マーケットプレイスを探す
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasedArticles;





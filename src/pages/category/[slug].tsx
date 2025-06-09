import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/footer';
import Sidebar from '../../components/Sidebar';
import PromptGrid from '../../components/prompt-grid';
import { PromptItem } from '../prompts/[id]';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../../components/index';

const CategoryPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryDescription, setCategoryDescription] = useState<string>('');
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 記事をPromptItem形式に変換する関数
  const transformToPromptItem = (item: any): PromptItem => {
    // プロフィール情報を取得（存在する場合）
    const profileData = item.profiles || {};
    const displayName = profileData.display_name || '匿名';  // usernameは使わず、display_nameがなければ「匿名」

    // 日付のフォーマット - より詳細な相対時間表示に変更
    const postedDate = new Date(item.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
    
    // 分単位の差分
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    let postedAt;
    
    // 60分未満なら「〇分前」
    if (diffMinutes < 60) {
      postedAt = diffMinutes <= 0 ? 'たった今' : `${diffMinutes}分前`;
    } 
    // 時間単位の差分
    else {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      
      // 24時間未満なら「〇時間前」
      if (diffHours < 24) {
        postedAt = `${diffHours}時間前`;
      } 
      // 日単位の差分
      else {
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // 30日未満なら「〇日前」
        if (diffDays < 30) {
          postedAt = `${diffDays}日前`;
        } 
        // 月単位の差分
        else {
          const diffMonths = Math.floor(diffDays / 30);
          
          // 12ヶ月未満なら「〇ヶ月前」
          if (diffMonths < 12) {
            postedAt = `${diffMonths}ヶ月前`;
          }
          // それ以上なら「〇年前」
          else {
            const diffYears = Math.floor(diffDays / 365);
            postedAt = `${diffYears}年前`;
          }
        }
      }
    }

    return {
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnail_url || '/images/default-thumbnail.svg',
      user: {
        name: displayName,
        account_name: displayName,
        avatarUrl: profileData.avatar_url || DEFAULT_AVATAR_URL,
      },
      postedAt: postedAt,
      likeCount: item.like_count ?? 0,
    };
  };

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // APIを使ってカテゴリー情報と記事を取得
        const response = await fetch(`/api/prompts/category?slug=${slug}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'カテゴリーデータの取得に失敗しました');
        }
        
        const data = await response.json();
        
        // カテゴリー情報をセット
        setCategoryName(data.category.name);
        setCategoryDescription(data.category.description || '');
        
        // 記事をPromptItem形式に変換
        const formattedPrompts = data.prompts.map(transformToPromptItem);
        setPrompts(formattedPrompts);
        
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError(error instanceof Error ? error.message : 'データの取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategory();
  }, [slug]);

  // ブレッドクラムコンポーネント
  const Breadcrumb = () => (
    <div className="bg-gray-50 py-3 px-4 sm:px-6 md:px-8 border-b sticky top-0 z-10 md:static md:z-auto md:mt-0">
      <div className="container mx-auto flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="flex items-center hover:text-gray-900 flex-shrink-0">
          <Home size={14} className="mr-1" />
          ホーム
        </Link>
        <ChevronRight size={14} className="mx-2 flex-shrink-0" />
        <Link href="/category" className="hover:text-gray-900 flex-shrink-0">
          カテゴリー
        </Link>
        <ChevronRight size={14} className="mx-2 flex-shrink-0" />
        <span className="font-medium text-gray-900 flex-shrink-0">{categoryName || '読み込み中...'}</span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 md:ml-[240px]">
          <Breadcrumb />
          <main className="pb-12 pt-2">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(8).fill(0).map((_, index) => (
                    <div key={index} className="bg-gray-200 h-64 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>{categoryName ? `${categoryName}のAIプロンプト一覧 | Prompty` : 'カテゴリー | Prompty'}</title>
        <meta name="description" content={categoryDescription || `${categoryName}に関するAIプロンプトの一覧ページです。${prompts.length}件のプロンプトが投稿されています。`} />
        <meta name="keywords" content={`${categoryName},AIプロンプト,カテゴリー,ChatGPT,MidJourney,Stable Diffusion`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://prompty-ai.com/category/${slug}`} />
        <meta property="og:title" content={`${categoryName}のAIプロンプト一覧 | Prompty`} />
        <meta property="og:description" content={categoryDescription || `${categoryName}に関するAIプロンプトの一覧ページです。`} />
        <meta property="og:image" content="https://prompty-ai.com/images/prompty_logo.jpg" />
        <meta property="og:site_name" content="Prompty" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://prompty-ai.com/category/${slug}`} />
        <meta name="twitter:title" content={`${categoryName}のAIプロンプト一覧 | Prompty`} />
        <meta name="twitter:description" content={categoryDescription || `${categoryName}に関するAIプロンプトの一覧ページです。`} />
        <meta name="twitter:image" content="https://prompty-ai.com/images/prompty_logo.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://prompty-ai.com/category/${slug}`} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": `${categoryName}のAIプロンプト一覧`,
              "description": categoryDescription || `${categoryName}に関するAIプロンプトの一覧`,
              "url": `https://prompty-ai.com/category/${slug}`,
              "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": prompts.length,
                "itemListElement": prompts.slice(0, 10).map((item, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "CreativeWork",
                    "name": item.title,
                    "url": `https://prompty-ai.com/prompts/${item.id}`,
                    "author": {
                      "@type": "Person",
                      "name": item.user.name
                    }
                  }
                }))
              },
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "ホーム",
                    "item": "https://prompty-ai.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "カテゴリー",
                    "item": "https://prompty-ai.com/category"
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": categoryName,
                    "item": `https://prompty-ai.com/category/${slug}`
                  }
                ]
              }
            })
          }}
        />
      </Head>
      
      <div className="flex-1 md:ml-[240px]">
        <Breadcrumb />
        <main className="pb-12 pt-2">
          <div className="container px-4 sm:px-6 md:px-8">
            {error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  ホームに戻る
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2">{categoryName}</h1>
                  {categoryDescription && (
                    <p className="text-gray-600">{categoryDescription}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">記事数: {prompts.length}</p>
                </div>
                
                {prompts.length > 0 ? (
                  <PromptGrid 
                    prompts={prompts}
                    horizontalScroll={false}
                    showViewAll={false}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">このカテゴリーにはまだ記事がありません。</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default CategoryPage; 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Footer from '../components/footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/prompt-grid';
import { useResponsive } from '../hooks/use-responsive';
import Head from 'next/head';
import { PromptItem } from '../components/prompt-grid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_AVATAR_URL } from '../components/common/Avatar';

// 記事をPromptItem形式に変換する関数
const transformToPromptItem = (item: any): PromptItem => {
  // プロフィール情報を取得（存在する場合）
  const profileData = item.profiles || {};
  const displayName = profileData.display_name || profileData.username || '匿名';

  // 日付のフォーマット
  const postedDate = new Date(item.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - postedDate.getTime());
  
  // 経過時間を計算
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  
  let postedAt;
  if (diffMinutes < 60) {
    postedAt = `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    postedAt = `${diffHours}時間前`;
  } else if (diffDays < 30) {
    postedAt = `${diffDays}日前`;
  } else if (diffMonths < 12) {
    postedAt = `${diffMonths}ヶ月前`;
  } else {
    postedAt = `${diffYears}年前`;
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
    likeCount: item.like_count || 0,
  };
};

const Featured: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedPrompts = async () => {
      setLoading(true);
      try {
        // APIエンドポイントから特集記事データを取得
        const response = await fetch('/api/prompts/featured-and-popular?limit=50');
        
        if (!response.ok) {
          throw new Error('API呼び出しに失敗しました');
        }
        
        const data = await response.json();
        
        // 特集記事データを取得
        if (data.featuredPrompts && data.featuredPrompts.length > 0) {
          // 取得した記事をPromptItem形式に変換
          const formattedPrompts = data.featuredPrompts.map((item: any) => transformToPromptItem(item));
          setPrompts(formattedPrompts);
        } else {
          // データが無い場合は空配列をセット
          setPrompts([]);
        }
      } catch (error) {
        console.error('記事取得エラー:', error);
        setError('記事の読み込みに失敗しました');
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPrompts();
  }, []);

  // ブレッドクラムコンポーネント
  const Breadcrumb = () => (
    <div className="bg-gray-50 py-3 px-4 sm:px-6 md:px-8 border-b sticky top-0 z-10 md:static md:z-auto mt-14 md:mt-0">
      <div className="container mx-auto flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="flex items-center hover:text-gray-900 flex-shrink-0">
          <Home size={14} className="mr-1" />
          ホーム
        </Link>
        <ChevronRight size={14} className="mx-2 flex-shrink-0" />
        <span className="font-medium text-gray-900 flex-shrink-0">特集記事</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>特集記事 | Prompty</title>
        <meta name="description" content="Promptyの特集記事一覧です。厳選された特集記事をお楽しみいただけます。" />
      </Head>
      
      <Sidebar />
      <div className="flex-1 md:ml-[240px]">
        <Breadcrumb />
        <main className="pb-12 pt-2">
          <div className="container px-4 sm:px-6 md:px-8">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(8).fill(0).map((_, index) => (
                    <div key={index} className="bg-gray-200 h-64 rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  再読み込み
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2">特集記事</h1>
                  <p className="text-gray-600">
                    Promptyが厳選した特集記事を紹介しています。注目のプロンプトやコンテンツをご覧いただけます。
                  </p>
                  <p className="text-sm text-gray-500 mt-2">表示件数: {prompts.length}件</p>
                </div>
                
                {prompts.length > 0 ? (
                  <PromptGrid 
                    prompts={prompts}
                    horizontalScroll={false}
                    showViewAll={false}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">特集記事がまだありません。</p>
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

export default Featured; 

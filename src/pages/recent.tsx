import React, { useState, useEffect } from 'react';
import Footer from '../components/footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/prompt-grid';
import { useResponsive } from '../hooks/use-responsive';
import Head from 'next/head';
import { PromptItem } from '../components/prompt-grid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../components/index';

const Recent: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 記事をPromptItem形式に変換する関数
  const transformToPromptItem = (item: any): PromptItem => {
    const profileData = item.profiles || {};
    const displayName = profileData.display_name || '匿名';

    // 日付のフォーマット
    const postedDate = new Date(item.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
    
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    let postedAt;
    
    if (diffMinutes < 60) {
      postedAt = diffMinutes <= 0 ? 'たった今' : `${diffMinutes}分前`;
    } else {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        postedAt = `${diffHours}時間前`;
      } else {
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
          postedAt = `${diffDays}日前`;
        } else {
          const diffMonths = Math.floor(diffDays / 30);
          
          if (diffMonths < 12) {
            postedAt = `${diffMonths}ヶ月前`;
          } else {
            const diffYears = Math.floor(diffDays / 365);
            postedAt = `${diffYears}年前`;
          }
        }
      }
    }

    const thumbnailUrl = item.thumbnail_url || '/images/default-thumbnail.svg';
    let isVideo = false;
    
    if (item.media_type) {
      isVideo = item.media_type === 'video';
    } else {
      const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
      isVideo = videoExtensions.some(ext => thumbnailUrl.toLowerCase().includes(ext));
    }
    
    const finalMediaType = isVideo ? 'video' : 'image';
    
    return {
      id: item.id,
      title: item.title,
      thumbnailUrl: thumbnailUrl,
      mediaType: finalMediaType,
      user: {
        name: displayName,
        account_name: displayName,
        avatarUrl: profileData.avatar_url || DEFAULT_AVATAR_URL,
      },
      postedAt: postedAt,
      likeCount: item.like_count ?? 0,
      views: item.view_count ?? 0,
    };
  };

  useEffect(() => {
    const fetchRecentPrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 新着記事を取得
        const response = await fetch('/api/prompts/recent');
        
        if (!response.ok) {
          throw new Error('新着記事の取得に失敗しました');
        }
        
        const data = await response.json();
        const transformedPrompts = data.recentPrompts.map(transformToPromptItem);
        
        console.log('🔍 新着記事ページ - 取得したデータ:', transformedPrompts);
        
        setPrompts(transformedPrompts);
        
      } catch (error) {
        console.error('新着記事取得エラー:', error);
        setError('新着記事の取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentPrompts();
  }, []);

  // ブレッドクラムコンポーネント
  const Breadcrumb = () => (
    <div className="bg-gray-50 py-3 px-4 sm:px-6 md:px-8 border-b sticky top-0 z-10 md:static md:z-auto md:mt-0">
      <div className="container mx-auto flex items-center text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="flex items-center hover:text-gray-900 flex-shrink-0">
          <Home size={14} className="mr-1" />
          ホーム
        </Link>
        <ChevronRight size={14} className="mx-2 flex-shrink-0" />
        <span className="font-medium text-gray-900 flex-shrink-0">新着記事</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>新着記事 | Prompty</title>
        <meta name="description" content="Promptyの新着記事一覧です。最新の30記事を投稿順で確認できます。" />
      </Head>
      
      <Sidebar />
      
      <div className="flex-1 md:ml-[240px]">
        <Breadcrumb />
        <main className="pb-12 pt-2">
          <div className="container px-4 sm:px-6 md:px-8">
            {error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  再読み込み
                </button>
              </div>
            ) : isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(8).fill(0).map((_, index) => (
                    <div key={index} className="bg-gray-200 h-64 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2">新着記事</h1>
                  <p className="text-gray-600">
                    最新の記事を投稿順で表示しています。新しく投稿された記事をチェックしてみましょう。
                  </p>
                  <p className="text-sm text-gray-500 mt-2">表示件数: {prompts.length}件（最新30件まで）</p>
                </div>
                
                {prompts.length > 0 ? (
                  <PromptGrid 
                    prompts={prompts}
                    horizontalScroll={false}
                    showViewAll={false}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">新着記事がまだありません。</p>
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

export default Recent; 
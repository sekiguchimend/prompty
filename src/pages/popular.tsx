import React, { useState, useEffect } from 'react';
import Footer from '../components/footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/prompt-grid';
import { getPopularPrompts } from '../lib/api';
import { useResponsive } from '../hooks/use-responsive';
import Head from 'next/head';
import { PromptItem } from '../components/prompt-grid';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const Popular: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularPrompts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Supabaseから人気の記事を取得（制限を大きく設定して実質すべて表示）
        const popularPrompts = await getPopularPrompts(50); // 100件まで表示可能に変更
        setPrompts(popularPrompts);
        
      } catch (error) {
        console.error('人気記事取得エラー:', error);
        setError('人気記事の取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPopularPrompts();
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
        <span className="font-medium text-gray-900 flex-shrink-0">人気の記事</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Head>
        <title>人気の記事 | Prompty</title>
        <meta name="description" content="Promptyで人気の記事一覧です。多くのユーザーに読まれている人気の記事をチェックできます。" />
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
                  <h1 className="text-2xl font-bold mb-2">人気の記事</h1>
                  <p className="text-gray-600">
                    多くのユーザーに読まれている人気記事を集めました。ビュー数の多い記事をすべて表示しています。
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
                    <p className="text-gray-500">人気の記事がまだありません。</p>
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

export default Popular; 
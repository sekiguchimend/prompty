import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/footer';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronRight, Home, Bookmark } from 'lucide-react';

// カテゴリーの型定義
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt_count?: number;
}

const CategoryIndexPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // カテゴリー情報を取得
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) {
          console.error('カテゴリー取得エラー:', categoriesError);
          setError('カテゴリーの取得に失敗しました。');
          setIsLoading(false);
          return;
        }
        
        if (!categoriesData || categoriesData.length === 0) {
          setError('カテゴリーが見つかりません。');
          setIsLoading(false);
          return;
        }
        
        // 各カテゴリーの記事数を取得
        const categoriesWithCounts = await Promise.all(
          categoriesData.map(async (category) => {
            const { count, error: countError } = await supabase
              .from('prompts')
              .select('id', { count: 'exact', head: true })
              .eq('category_id', category.id)
              .eq('published', true);
              
            if (countError) {
              console.error(`カテゴリー「${category.name}」の記事数取得エラー:`, countError);
              return { ...category, prompt_count: 0 };
            }
            
            return { ...category, prompt_count: count || 0 };
          })
        );
        
        // 記事数でソート（多い順）
        const sortedCategories = categoriesWithCounts.sort((a, b) => 
          (b.prompt_count || 0) - (a.prompt_count || 0)
        );
        
        setCategories(sortedCategories);
        
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
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
        <span className="font-medium text-gray-900 flex-shrink-0">カテゴリー一覧</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Array(9).fill(0).map((_, index) => (
                    <div key={index} className="bg-gray-200 h-32 rounded"></div>
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
        <title>カテゴリー一覧 - Prompty</title>
        <meta name="description" content="Promptyの記事カテゴリー一覧です。様々なトピックの記事を見つけることができます。" />
      </Head>
      
      <div className="flex-1 md:ml-[240px]">
        <Breadcrumb />
        <main className="pb-12 pt-2">
          <div className="container px-4 sm:px-6 md:px-8">
            {error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  ホームに戻る
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-2">カテゴリー一覧</h1>
                  <p className="text-gray-600">興味のあるカテゴリーをクリックして、記事を探してみましょう。</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <Link 
                      href={`/category/${category.slug}`} 
                      key={category.id}
                      className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <Bookmark className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold mb-1">{category.name}</h2>
                          {category.description && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{category.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            記事数: {category.prompt_count || 0}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default CategoryIndexPage; 
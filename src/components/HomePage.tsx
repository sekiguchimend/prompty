import { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { useResponsive } from '../hooks/use-responsive';
import { PromptItem } from '../pages/prompts/[id]';

// カテゴリの型定義
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

// カテゴリごとの記事を管理するための型
interface CategoryContent {
  category: Category;
  prompts: PromptItem[];
}

// 特別なカテゴリー名とそのスラッグ定義
const SPECIAL_CATEGORIES: Record<string, string> = {
  '生成AI': 'generative-ai',
  '画像生成': 'image-generation'
};

const HomePage: React.FC = () => {
  // より詳細な画面サイズ情報を取得
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  
  // 画面幅に応じてカード数を調整する関数
  const getDisplayCount = useMemo(() => {
    if (isDesktop) {
      if (width >= 1280) return 5; // xl以上
      return 4; // lg
    }
    if (isTablet) return 3; // md
    return 6; // スマホは横スクロール表示のため、多めに表示
  }, [isDesktop, isTablet, width]);

  // 横スクロール表示の条件（タブレット以下で適用）
  const shouldUseHorizontalScroll = true; // ホームページでは常に横スクロール表示を使用
  
  // APIから取得したプロンプトデータ
  const [processingFeaturedPrompts, setProcessingFeaturedPrompts] = useState<PromptItem[]>([]);
  const [processingPopularPosts, setProcessingPopularPosts] = useState<PromptItem[]>([]);
  // カテゴリごとの記事
  const [categoryContents, setCategoryContents] = useState<CategoryContent[]>([]);
  // 特別に扱うカテゴリーのコンテンツ
  const [specialCategoryContents, setSpecialCategoryContents] = useState<CategoryContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        avatarUrl: profileData.avatar_url || '/images/default-avatar.svg',
      },
      postedAt: postedAt,
      likeCount: item.like_count ?? 0,
    };
  };

  // カテゴリー名に対応するリンク先URLを取得する関数
  const getCategoryUrl = (categoryName: string, categorySlug: string): string => {
    // 特別なカテゴリーの場合はそのスラッグを使用
    if (Object.keys(SPECIAL_CATEGORIES).includes(categoryName)) {
      const specialSlug = SPECIAL_CATEGORIES[categoryName];
      return `/category/${specialSlug}`;
    }
    // 通常のカテゴリーの場合はカテゴリーのスラッグを使用
    return `/category/${categorySlug}`;
  };

  // データを一度に取得するuseEffect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null); // エラー状態をリセット
        
        // 特集記事と人気記事を取得
        const featuredAndPopularResponse = await fetch(`/api/prompts/featured-and-popular?limit=${getDisplayCount + 2}`);
        
        if (!featuredAndPopularResponse.ok) {
          const errorData = await featuredAndPopularResponse.json();
          throw new Error(errorData.error || '特集記事と人気記事の取得に失敗しました');
        }
        
        const featuredAndPopularData = await featuredAndPopularResponse.json();
        
        // データを整形
        const formattedFeaturedPrompts = featuredAndPopularData.featuredPrompts.map(transformToPromptItem);
        const formattedPopularPrompts = featuredAndPopularData.popularPrompts.map(transformToPromptItem);
        
        setProcessingFeaturedPrompts(formattedFeaturedPrompts);
        setProcessingPopularPosts(formattedPopularPrompts);
        
        // カテゴリー別記事を取得
        const categoryResponse = await fetch('/api/prompts/by-category');
        
        if (!categoryResponse.ok) {
          const errorData = await categoryResponse.json();
          throw new Error(errorData.error || 'カテゴリー別記事の取得に失敗しました');
        }
        
        const categoryData = await categoryResponse.json();
        
        // 特別カテゴリーのデータを整形
        const specialCategories = categoryData.specialCategories.map((item: any) => ({
          category: item.category,
          prompts: item.prompts.map(transformToPromptItem)
        }));
        
        // 通常カテゴリーのデータを整形
        const regularCategories = categoryData.regularCategories.map((item: any) => ({
          category: item.category,
          prompts: item.prompts.map(transformToPromptItem)
        }));
        
        setSpecialCategoryContents(specialCategories);
        setCategoryContents(regularCategories);
        
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [getDisplayCount]);

  // ローディング状態をチェック
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <Sidebar />
        <div className="flex-1 md:ml-[240px]">
          <main className="pb-12 pt-0">
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
      <Header />
      <Sidebar />
      
      <div className="flex-1 md:ml-[240px]">
        <main className="pb-12 pt-0">
          <div className="container px-4 sm:px-6 md:px-8">
            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-4">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  再読み込み
                </button>
              </div>
            )}
                 {/* Popular posts section */}
                 <PromptSection 
              title="人気の記事" 
              prompts={processingPopularPosts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={getDisplayCount}
              className="mt-0"
              categoryUrl="/Popular"
              moreLinkUrl="/Popular"
              isFeatureSection={true}
            />
            {/* Featured prompts section */}
           

     

            {/* 特別カテゴリーのセクション */}
            {specialCategoryContents.map((categoryContent) => (
              <PromptSection 
                key={categoryContent.category.id}
                title={categoryContent.category.name} 
                prompts={categoryContent.prompts}
                showMoreLink={true}
                horizontalScroll={shouldUseHorizontalScroll}
                maxVisible={getDisplayCount}
                className="mt-4"
                categoryUrl={getCategoryUrl(categoryContent.category.name, categoryContent.category.slug)}
                moreLinkUrl={getCategoryUrl(categoryContent.category.name, categoryContent.category.slug)}
              />
            ))}

            {/* カテゴリー「生成AI」がない場合のフォールバック表示（手動で追加） */}
            {specialCategoryContents.filter(cat => 
              cat.category.name === '生成AI' ||
              cat.category.slug === 'generative-ai'
            ).length === 0 && (
              <div className="mt-4">
                <h2 className="text-xl font-bold flex items-center mb-6">
                  <span className="flex-1">生成AI</span>
                  <a href="/category/generative-ai" className="text-sm font-normal text-blue-600 hover:underline">
                    もっと見る
                  </a>
                </h2>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-500 text-center">
                    生成AIカテゴリーの記事を表示できません。データ取得中にエラーが発生したか、まだ記事がありません。
                  </p>
                </div>
              </div>
            )}

            {/* その他のカテゴリーごとのセクション */}
            {categoryContents.map((categoryContent) => (
              <PromptSection 
                key={categoryContent.category.id}
                title={categoryContent.category.name} 
                prompts={categoryContent.prompts}
                showMoreLink={true}
                horizontalScroll={shouldUseHorizontalScroll}
                maxVisible={getDisplayCount}
                className="mt-4"
                categoryUrl={`/category/${categoryContent.category.slug}`}
                moreLinkUrl={`/category/${categoryContent.category.slug}`}
              />
            ))}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

// メモ化してコンポーネントの不要な再レンダリングを防止
export default HomePage;

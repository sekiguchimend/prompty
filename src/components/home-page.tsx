import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './footer';
import PromptSection from './prompt-section';
import { useResponsive } from '../hooks/use-responsive';
import { PromptItem } from '../pages/prompts/[id]';
import { cachedFetch, generateCacheKey } from '../lib/cache';
import { DEFAULT_AVATAR_URL } from './index';

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

const HomePage: React.FC = memo(() => {
  // より詳細な画面サイズ情報を取得
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  
  // 画面幅に応じてカード数を調整する関数 - useCallbackで最適化
  const getDisplayCount = useCallback(() => {
    if (isDesktop) {
      if (width >= 1280) return 5; // xl以上
      return 4; // lg
    }
    if (isTablet) return 3; // md
    return 6; // スマホは横スクロール表示のため、多めに表示
  }, [isDesktop, isTablet, width]);

  // 横スクロール表示の条件をuseMemoで最適化
  const shouldUseHorizontalScroll = useMemo(() => true, []); // ホームページでは常に横スクロール表示を使用
  
  // APIから取得したプロンプトデータ
  const [processingFeaturedPrompts, setProcessingFeaturedPrompts] = useState<PromptItem[]>([]);
  const [processingPopularPosts, setProcessingPopularPosts] = useState<PromptItem[]>([]);
  const [processingRecentPosts, setProcessingRecentPosts] = useState<PromptItem[]>([]);
  // カテゴリごとの記事
  const [categoryContents, setCategoryContents] = useState<CategoryContent[]>([]);
  // 特別に扱うカテゴリーのコンテンツ
  const [specialCategoryContents, setSpecialCategoryContents] = useState<CategoryContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 記事をPromptItem形式に変換する関数 - useCallbackで最適化
  const transformToPromptItem = useCallback((item: any): PromptItem => {
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
        
        if (diffDays < 30) {
          postedAt = `${diffDays}日前`;
        } 
        else {
          const diffMonths = Math.floor(diffDays / 30);
          
          if (diffMonths < 12) {
            postedAt = `${diffMonths}ヶ月前`;
          }
          else {
            const diffYears = Math.floor(diffDays / 365);
            postedAt = `${diffYears}年前`;
          }
        }
      }
    }

    // データベースのmedia_typeを優先し、フォールバック用にURL拡張子判定も残す
    const thumbnailUrl = item.thumbnail_url || '/images/default-thumbnail.svg';
    let isVideo = false;
    
    if (item.media_type) {
      // データベースにmedia_typeがある場合はそれを使用
      isVideo = item.media_type === 'video';
    } else {
      // フォールバック: URLから拡張子を取得してメディアタイプを判定
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
    };
  }, []);

  // カテゴリURL生成をuseCallbackで最適化
  const getCategoryUrl = useCallback((categoryName: string, categorySlug: string): string => {
    if (Object.keys(SPECIAL_CATEGORIES).includes(categoryName)) {
      const specialSlug = SPECIAL_CATEGORIES[categoryName];
      return `/category/${specialSlug}`;
    }
    return `/category/${categorySlug}`;
  }, []);

  // データ取得処理をuseCallbackで最適化
  const fetchAllData = useCallback(async (currentDisplayCount: number) => {
    try {
      setIsLoading(true);
      setError(null); 
      
      // 30秒のタイムアウト設定
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000);
      
      // 並列でAPIを呼び出し
      const [featuredAndPopularResponse, categoryResponse, recentResponse] = await Promise.all([
        fetch(`/api/prompts/featured-and-popular?limit=${currentDisplayCount + 2}`, {
          signal: controller.signal
        }),
        fetch('/api/prompts/by-category', {
          signal: controller.signal
        }),
        fetch('/api/prompts/recent', {
          signal: controller.signal
        })
      ]);
      
      clearTimeout(timeoutId);
      
      // レスポンスのエラーチェック
      if (!featuredAndPopularResponse.ok) {
        const errorData = await featuredAndPopularResponse.json().catch(() => ({}));
        throw new Error(errorData.error || '特集記事と人気記事の取得に失敗しました');
      }
      
      if (!categoryResponse.ok) {
        const errorData = await categoryResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'カテゴリー別記事の取得に失敗しました');
      }
      
      if (!recentResponse.ok) {
        const errorData = await recentResponse.json().catch(() => ({}));
        throw new Error(errorData.error || '新着記事の取得に失敗しました');
      }
      
      // 並列でJSONを解析
      const [featuredAndPopularData, categoryData, recentData] = await Promise.all([
        featuredAndPopularResponse.json(),
        categoryResponse.json(),
        recentResponse.json()
      ]);
      
      // データの変換処理
      const formattedFeaturedPrompts = (featuredAndPopularData.featuredPrompts || []).map(transformToPromptItem);
      const formattedPopularPrompts = (featuredAndPopularData.popularPrompts || []).map(transformToPromptItem);
      const formattedRecentPrompts = (recentData.recentPrompts || []).map(transformToPromptItem);
      
      const specialCategories = (categoryData.specialCategories || []).map((item: any) => ({
        category: item.category,
        prompts: (item.prompts || []).map(transformToPromptItem)
      }));
      
      const regularCategories = (categoryData.regularCategories || []).map((item: any) => ({
        category: item.category,
        prompts: (item.prompts || []).map(transformToPromptItem)
      }));
      
      // バッチで状態を更新
      setProcessingFeaturedPrompts(formattedFeaturedPrompts);
      setProcessingPopularPosts(formattedPopularPrompts);
      setProcessingRecentPosts(formattedRecentPrompts);
      setSpecialCategoryContents(specialCategories);
      setCategoryContents(regularCategories);
      
    } catch (error) {
      console.error('データ取得エラー:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('データの読み込みがタイムアウトしました。再度お試しください。');
        } else {
          setError(error.message);
        }
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      // 必ずローディング状態を解除
      setIsLoading(false);
    }
  }, [transformToPromptItem]);

  useEffect(() => {
    const currentDisplayCount = getDisplayCount();
    fetchAllData(currentDisplayCount);
  }, [getDisplayCount, fetchAllData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <Sidebar />
        <div className="flex-1 md:ml-[240px]">
          <main className="pb-12">
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
        <main className="pb-12">
          <div className="container px-4 sm:px-6 md:px-8">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      読み込みエラー
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      window.location.reload();
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    再読み込み
                  </button>
                </div>
              </div>
            )}
                 <PromptSection 
              title="人気の記事" 
              prompts={processingPopularPosts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={getDisplayCount()}
              className="mt-0"
              categoryUrl="/popular"
              moreLinkUrl="/popular"
              isFeatureSection={true}
            />

            <PromptSection 
              title="新着記事" 
              prompts={processingRecentPosts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={getDisplayCount()}
              className="mt-4"
              categoryUrl="/recent"
              moreLinkUrl="/recent"
              isFeatureSection={true}
            />
           
            {specialCategoryContents.map((categoryContent) => (
              <PromptSection 
                key={categoryContent.category.id}
                title={categoryContent.category.name} 
                prompts={categoryContent.prompts}
                showMoreLink={true}
                horizontalScroll={shouldUseHorizontalScroll}
                maxVisible={getDisplayCount()}
                className="mt-4"
                categoryUrl={getCategoryUrl(categoryContent.category.name, categoryContent.category.slug)}
                moreLinkUrl={getCategoryUrl(categoryContent.category.name, categoryContent.category.slug)}
              />
            ))}



            {categoryContents.map((categoryContent) => (
              <PromptSection 
                key={categoryContent.category.id}
                title={categoryContent.category.name} 
                prompts={categoryContent.prompts}
                showMoreLink={true}
                horizontalScroll={shouldUseHorizontalScroll}
                maxVisible={getDisplayCount()}
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
});

HomePage.displayName = 'HomePage';

export default HomePage;

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/PromptGrid';
import { useResponsive } from '../hooks/use-responsive';
import { supabase } from '../lib/supabaseClient';
import { PromptItem } from '../components/PromptGrid';

// 記事をPromptItem形式に変換する関数
const transformToPromptItem = (item: any): PromptItem => {
  // プロフィール情報を取得（存在する場合）
  const profileData = item.profiles || {};
  const displayName = profileData.display_name || profileData.username || '匿名さん';

  // 日付のフォーマット
  const postedDate = new Date(item.created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - postedDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let postedAt;
  if (diffDays === 0) {
    postedAt = '今日';
  } else if (diffDays === 1) {
    postedAt = '昨日';
  } else if (diffDays < 7) {
    postedAt = `${diffDays}日前`;
  } else {
    postedAt = postedDate.toLocaleDateString('ja-JP');
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
    likeCount: item.like_count || 0,
  };
};

const Featured: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 生成AIカテゴリのIDを検索
    const fetchGenerativeAICategory = async () => {
      setLoading(true);
      try {
        // まず「生成AI」という名前のカテゴリを検索
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', '生成AI')
          .maybeSingle();

        if (categoryError) {
          throw categoryError;
        }

        const generativeAICategoryId = categoryData?.id;
        
        // カテゴリIDがあれば、そのカテゴリに属する記事を取得
        if (generativeAICategoryId) {
          const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select(`
              id,
              title,
              thumbnail_url,
              created_at,
              like_count,
              profiles:author_id (
                id,
                display_name,
                username,
                avatar_url
              )
            `)
            .eq('category_id', generativeAICategoryId)
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(20);

          if (promptsError) {
            throw promptsError;
          }

          if (promptsData && promptsData.length > 0) {
            // 取得した記事をPromptItem形式に変換
            const formattedPrompts = promptsData.map(item => transformToPromptItem(item));
            setPrompts(formattedPrompts);
          } else {
            // データが無い場合は空配列をセット
            setPrompts([]);
          }
        } else {
          // カテゴリが見つからない場合
          setError('生成AIカテゴリが見つかりませんでした');
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

    fetchGenerativeAICategory();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Sidebar />
      <div className="flex flex-col flex-1 md:ml-[240px]">

      <div className="flex flex-1 pt-10">
        <main className="flex-1 pb-12 overflow-x-hidden md:mt-0 mt-5">
          <div className="container px-4 py-6 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold mb-6">生成AIの注目プロンプト</h1>
            <p className="text-gray-600 mb-8">
              生成AIに関する注目のAIプロンプト集です。人気クリエイターによる厳選されたプロンプトを紹介しています。
            </p>
            
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
              </div>
            ) : prompts.length > 0 ? (
              <PromptGrid 
                prompts={prompts} 
                horizontalScroll={false} 
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">表示できる記事がありません</p>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <Footer />
      </div>
    </div>
  );
};

export default Featured; 
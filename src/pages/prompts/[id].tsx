import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '../../components/ui/separator';
import PopularArticles from '../../components/PopularArticles';
import AuthorSidebar from '../../components/prompt/AuthorSidebar';
import PromptContent from '../../components/prompt/PromptContent';
import PurchaseSection from '../../components/prompt/PurchaseSection';
import { getDetailPost, getPopularPosts } from '../../data/posts';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { PostItem } from '../../data/posts';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';

// PromptItemの型定義 - エクスポートする
export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
    avatarUrl: string;
    account_name?: string;
  };
  postedAt: string;
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];  // タグの配列を追加
}

// 拡張された投稿アイテムの型定義
interface ExtendedPostItem extends PostItem {
  site_url?: string;
}

// サーバーサイドレンダリングに変更
export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const id = params?.id as string;
  
  
  if (!id) {
    console.error("IDが指定されていません");
    return {
      notFound: true,
    };
  }

  // UUIDの検証とフォーマット
  let formattedId = id;
  
  // UUIDのフォーマットチェック (例: 123e4567-e89b-12d3-a456-426614174000)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidPattern.test(id)) {
    // 短いIDをUUID形式に変換する試み
    if (/^[0-9a-f]{8}$/i.test(id)) {
      // 8桁のIDを標準UUIDに拡張
      formattedId = `${id}-0000-0000-0000-000000000000`;
    } else {
      console.error("無効なID形式:", id);
      return {
        notFound: true,
      };
    }
  }
  
  // Supabaseからプロンプトデータを取得 - IDで検索
  let { data: promptData, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      thumbnail_url,
      content,
      created_at,
      price,
      author_id,
      view_count,
      profiles:profiles(id, username, display_name, avatar_url, bio),
      site_url
    `)
    .eq('id', formattedId)
    .single();
    
  // IDで見つからない場合は代替クエリを試行
  if (error && error.code === '22P02') {
    try {
      // シーケンシャルIDや他の形式のIDを使用している場合
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        // 数値IDで検索を試みる
        const { data: altData, error: altError } = await supabase
          .from('prompts')
          .select(`
            id,
            title,
            thumbnail_url,
            content,
            created_at,
            price,
            author_id,
            view_count,
            profiles:profiles(id, username, display_name, avatar_url, bio),
            site_url
          `)
          .eq('numeric_id', numericId) // 数値ID用のカラムがある場合（例: numeric_id）
          .single();
          
        if (!altError && altData) {
         
          promptData = altData;
          error = altError; // nullになるはず
        }
      }
    } catch (e) {
      console.error("代替検索中のエラー:", e);
    }
  }
    
    
  // プロンプトが見つからない、またはエラーが発生した場合は404を返す
  if (error || !promptData) {
    console.error("プロンプト取得エラー:", error);
    return {
      notFound: true,
    };
  }
  
  // ビューカウントを更新
  const { data: updateData, error: updateError } = await supabase
    .from('prompts')
    .update({ view_count: (promptData.view_count || 0) + 1 })
    .eq('id', formattedId);
    
  if (updateError) {
    console.error("ビューカウント更新エラー:", updateError);
  }
  
  // いいね数を取得
  const { count: likeCount, error: likeError } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', formattedId);
    
  if (likeError) {
    console.error("いいね数取得エラー:", likeError);
  }
    
  // 人気記事を取得
  const popularPosts = await getPopularPosts();
  
  // 必要なフォーマットに変換
  const profileData = promptData.profiles && promptData.profiles.length > 0 ? promptData.profiles[0] : null;
 
  
  // プロフィールデータが取得できない場合、著者IDで直接取得を試みる
  let authorProfile = profileData;
  if (!profileData && promptData.author_id) {
    const { data: directProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio')
      .eq('id', promptData.author_id)
      .single();
      
    if (!profileError && directProfile) {
      authorProfile = directProfile;
    } else {
      console.error("プロフィール直接取得エラー:", profileError);
    }
  }

  const postData: ExtendedPostItem = {
    id: promptData.id,
    title: promptData.title,
    thumbnailUrl: promptData.thumbnail_url || '/images/default-thumbnail.svg',
    content: promptData.content || [],
    price: promptData.price || 0,
    likeCount: likeCount || 0,
    postedAt: new Date(promptData.created_at).toLocaleDateString('ja-JP'),
    user: {
      userId: promptData.author_id || '',
      name: authorProfile?.display_name || '名無し',
      avatarUrl: authorProfile?.avatar_url || '/images/default-avatar.svg',
      bio: authorProfile?.bio || '著者情報なし',
      publishedAt: new Date(promptData.created_at).toLocaleDateString('ja-JP'),
      website: promptData.site_url || 'https://example.com'
    },
    site_url: promptData.site_url || ''
  };
  
  
  return {
    props: {
      postData,
      popularPosts
    }
  };
};

// propsを受け取るようにコンポーネントを修正
const PromptDetail = ({ postData, popularPosts }: { postData: ExtendedPostItem; popularPosts: PromptItem[] }) => {
  const router = useRouter();  
  // 404処理
  if (router.isFallback) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
          <p>読み込み中...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  // データチェック
  if (!postData) {
    console.error("postDataが見つかりません");
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-white mt-14 md:mt-10 flex items-center justify-center">
          <p>プロンプト情報を読み込めませんでした</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  // コンポーネントの型に合わせて整形
  const prompt = {
    ...postData,
    // AuthorSidebarの型に合わせる
    authorForSidebar: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      userId: postData.user.userId || '' // ユーザーID追加
    },
    // PromptContentの型に合わせる
    authorForContent: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      publishedAt: postData.user.publishedAt || '投稿日時なし' // 必須項目
    },
    // PurchaseSectionの型に合わせる
    authorForPurchase: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし', // 必須項目
      website: postData.user.website || 'https://example.com', // 必須項目
      userId: postData.user.userId || '' // ユーザーID追加
    }
  };
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換
  const popularArticles = popularPosts?.map((post: PromptItem) => ({
    id: post.id || '',
    title: post.title || 'タイトルなし',
    likes: post.likeCount || 0,
    thumbnailUrl: post.thumbnailUrl || '/images/default-thumbnail.svg',
    date: post.postedAt || '不明'
  })) || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-white md:mt-10">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center text-gray-500 mb-6 mt-10 md:mt-0">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">戻る</span>
          </Link>
          
          <div className="flex flex-col md:flex-row">
            {/* Left sidebar - Author info (smaller) */}
            <div className="hidden md:block md:w-56 flex-shrink-0 pr-6">
              <div className="sticky top-20">
                <AuthorSidebar
                  author={prompt.authorForSidebar}
                  tags={prompt.tags || []}
                  website={prompt.user.website || ''}
                />
              </div>
            </div>
            
            {/* Main content (centered) */}
            <div className="flex-1 max-w-3xl mx-auto">
              <PromptContent
                imageUrl={prompt.thumbnailUrl}
                title={prompt.title}
                content={prompt.content || []}
                author={prompt.authorForContent}
                price={prompt.price || 0}
                systemImageUrl={prompt.systemImageUrl}
                systemUrl={postData.site_url || ''}
              />
              
              {/* Purchase section */}
              <PurchaseSection
                wordCount={prompt.wordCount || 0}
                price={prompt.price || 0}
                tags={prompt.tags || []}
                reviewers={prompt.reviewers || []}
                reviewCount={prompt.reviewCount || 0}
                likes={prompt.likeCount}
                author={prompt.authorForPurchase}
                socialLinks={prompt.socialLinks || []}
              />
            </div>
            
            {/* Empty right space for balance */}
            <div className="hidden md:block md:w-56 flex-shrink-0"></div>
          </div>
        </div>
        
        {/* Popular Articles Section */}
        <Separator className="my-12" />
        {popularArticles.length > 0 ? (
          <PopularArticles articles={popularArticles} />
        ) : (
          <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold mb-6">人気記事</h2>
            <p className="text-gray-500 text-center py-6">現在、人気記事はありません</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default PromptDetail;
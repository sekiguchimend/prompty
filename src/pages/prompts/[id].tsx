import React from 'react';
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
import { GetStaticProps, GetStaticPaths } from 'next';
import { featuredPrompts, aiGeneratedPrompts } from '../../data/mockPrompts';
import { PostItem } from '../../data/posts';

// mockPromptsの型を定義
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
}

// GetStaticPathsを追加して、ビルド時に生成するパスを定義
export const getStaticPaths: GetStaticPaths = async () => {
  // featuredPromptsとaiGeneratedPromptsからすべてのIDを取得
  const allPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
  const paths = allPrompts.map(prompt => ({
    params: { id: prompt.id }
  }));

  return {
    paths,
    fallback: 'blocking' // 存在しないパスへのアクセス時はサーバーサイドでレンダリング
  };
};

// GetStaticPropsを追加して、指定されたIDのデータを取得
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string;
  
  // IDを使って実際のデータを取得
  // featuredPromptsとaiGeneratedPromptsを使って指定されたIDのプロンプトを探す
  const allPrompts = [...featuredPrompts, ...aiGeneratedPrompts];
  const promptData = allPrompts.find(prompt => prompt.id === id);
  
  // 該当するデータが見つからない場合は404を返す
  if (!promptData) {
    return {
      notFound: true,
    };
  }
  
  // 人気記事データを取得
  const popularPosts = getPopularPosts();
  
  // postDataの代わりにpromptDataを使用
  // ただし、getDetailPostから得られる追加データも必要なので、両方をマージする
  const postData = {
    ...getDetailPost(),
    ...promptData,
    title: promptData.title,
    thumbnailUrl: promptData.thumbnailUrl,
    likeCount: promptData.likeCount,
    postedAt: promptData.postedAt,
    user: {
      ...getDetailPost().user,
      name: promptData.user.name,
      avatarUrl: promptData.user.avatarUrl,
    }
  };
  
  return {
    props: {
      postData,
      popularPosts
    },
    revalidate: 60 // 60秒ごとに再生成（必要に応じて調整）
  };
};

// propsを受け取るようにコンポーネントを修正
const PromptDetail = ({ postData, popularPosts }: { postData: PostItem; popularPosts: PostItem[] }) => {
  // コンポーネントの型に合わせて整形
  const prompt = {
    ...postData,
    // AuthorSidebarの型に合わせる
    authorForSidebar: {
      name: postData.user.name,
      avatarUrl: postData.user.avatarUrl,
      bio: postData.user.bio || '著者情報なし' // 必須項目
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
      website: postData.user.website || 'https://example.com' // 必須項目
    }
  };
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換
  const popularArticles = popularPosts.map((post: PostItem) => ({
    id: post.id,
    title: post.title,
    likes: post.likeCount,
    thumbnailUrl: post.thumbnailUrl,
    date: post.postedAt
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-white mt-14 md:mt-10">
        <div className="container px-4 md:px-6 py-6 max-w-7xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center text-gray-500 mb-6">
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
                systemUrl={prompt.systemUrl}
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
        <PopularArticles articles={popularArticles} />
      </main>
      
      <Footer />
    </div>
  );
};

export default PromptDetail;
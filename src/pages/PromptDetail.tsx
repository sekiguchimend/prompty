import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import PopularArticles from '@/components/PopularArticles';
import AuthorSidebar from '@/components/prompt/AuthorSidebar';
import PromptContent from '@/components/prompt/PromptContent';
import PurchaseSection from '@/components/prompt/PurchaseSection';
import { getDetailPost, getPopularPosts } from '@/data/posts';

const PromptDetail = () => {
  // データファイルから詳細データを取得
  const postData = getDetailPost();
  
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

  // 人気記事データを取得
  const popularPosts = getPopularPosts();
  
  // PopularArticlesコンポーネントの型に合わせてデータを変換
  const popularArticles = popularPosts.map(post => ({
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
        <div className="container px-4 md:px-8 py-6 max-w-6xl mx-auto">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center text-gray-500 mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">戻る</span>
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left sidebar - Author info */}
            <div className="hidden md:block md:col-span-1">
              <AuthorSidebar 
                author={prompt.authorForSidebar} 
                tags={prompt.tags || []} 
                website={prompt.user.website || ''}
              />
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2">
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

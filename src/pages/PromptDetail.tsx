
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

const PromptDetail = () => {
  // Mock data for the prompt detail
  const prompt = {
    id: '1',
    title: '有料noteが売れない97%の人が知らない9つの思考法',
    content: [
      'こんにちは、末吉です。',
      'あなたがこのnoteを見つけたということは、きっとこんな悩みを持っているのかもしれません。',
      '・がんばって書いているのに、有料noteがなぜか売れない…」',
      '・あの人は簡単に売れているのに、私と何が違うんだろう…？」',
      '・自分の書いたnoteが売れていく感覚を味わってみたい…！',
      'もし1つでも当てはまるなら、このnoteはあなたのために書きました。',
      'じつは、有料noteが売れる人と売れない人の差は、「考え方」にあります。'
    ],
    author: {
      name: '末吉宏臣 / 『発信をお金にかえる勇気』',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      bio: '末吉宏臣 / 『発信をお金にかえる勇気』 著者',
      publishedAt: '2025年3月15日 11:29'
    },
    price: 980,
    likes: 97,
    wordCount: 3493,
    tags: [
      '有料note', 
      '末吉宏臣'
    ],
    website: 'https://hiroomisueyoshi.net/fx/mailmag',
    socialLinks: [
      {icon: 'twitter', url: '#'},
      {icon: 'facebook', url: '#'},
      {icon: 'instagram', url: '#'},
      {icon: 'youtube', url: '#'},
      {icon: 'line', url: '#'},
      {icon: 'tiktok', url: '#'},
      {icon: 'google-business', url: '#'},
      {icon: 'rss', url: '#'}
    ],
    reviewers: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
      'https://i.pravatar.cc/150?img=7'
    ]
  };

  // Mock data for popular articles
  const popularArticles = [
    {
      id: '2',
      title: '『夢がかなう！ ファンが増える！ エッセイの書き方』【追記】自己啓発エッセイのススメ（動画セミナー）（2023.1.11）',
      likes: 1814,
      imageUrl: '/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png'
    },
    {
      id: '3',
      title: 'たくさんお金を受け取って、たくさん好きな人やお店や会社に回せばいい。',
      likes: 621
    },
    {
      id: '4',
      title: '『お金から自由になる14のヒント』追記：大切なことをはじめるとき、まずはお金のことを忘れよう（2022.7.4）',
      likes: 1508,
      imageUrl: '/lovable-uploads/4ed80f0e-6902-4a40-92fc-56fea3e5bd1c.png'
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 bg-white">
        <div className="container px-4 md:px-8 py-6 max-w-6xl mx-auto">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center text-gray-500 mb-6">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">戻る</span>
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left sidebar - Author info */}
            <div className="md:col-span-1">
              <AuthorSidebar 
                author={prompt.author} 
                tags={prompt.tags} 
                website={prompt.website} 
              />
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2">
              <PromptContent 
                title={prompt.title}
                content={prompt.content}
                author={prompt.author}
                price={prompt.price}
              />
              
              {/* Purchase section */}
              <PurchaseSection 
                wordCount={prompt.wordCount}
                price={prompt.price}
                tags={prompt.tags}
                reviewers={prompt.reviewers}
                reviewCount={26}
                likes={prompt.likes}
                author={prompt.author}
                socialLinks={prompt.socialLinks}
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

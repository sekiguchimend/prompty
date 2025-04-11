import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChevronLeft, Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import AvatarGroup from '@/components/AvatarGroup';
import { Badge } from '@/components/ui/badge';
import PopularArticles from '@/components/PopularArticles';

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
              <div className="sticky top-20">
                <div className="flex flex-col items-start">
                  {/* Smaller author profile section */}
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <div className="w-14 h-14 rounded-full overflow-hidden mr-2">
                        <img 
                          src={prompt.author.avatarUrl} 
                          alt={prompt.author.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">{prompt.author.name}</h3>
                        <p className="text-xs text-gray-500">{prompt.author.bio}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-2 mb-4">
                    {prompt.tags.map((tag, index) => (
                      <div key={index} className="flex items-center">
                        {index === 0 && <span className="mr-1">👉</span>}
                        <span>{tag}</span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <a href={prompt.website} className="text-gray-400 hover:text-gray-600 text-xs truncate block">
                        {prompt.website}
                      </a>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mb-4 bg-gray-900 text-white hover:bg-gray-800 rounded-sm text-sm py-1 h-auto"
                  >
                    <span className="mr-1">👤</span> フォロー
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2">
              <article>
                <h1 className="text-3xl font-bold mb-8 leading-tight">{prompt.title}</h1>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <img 
                      src={prompt.author.avatarUrl} 
                      alt={prompt.author.name}
                      className="w-6 h-6 rounded-full mr-2" 
                    />
                    <div>
                      <p className="text-xs font-medium">{prompt.author.bio}</p>
                      <p className="text-xs text-gray-500">{prompt.author.publishedAt}</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-300 rounded-md py-1 px-3">
                    <span className="font-bold text-sm">¥{prompt.price}</span>
                  </div>
                </div>
                
                <div className="prose prose-gray max-w-none my-10 text-lg">
                  {prompt.content.map((paragraph, index) => (
                    <p key={index} className="mb-6">{paragraph}</p>
                  ))}
                </div>
                
                {/* Purchase section - New stylish bottom part */}
                <div className="mt-16 border-t border-gray-200 pt-10">
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-medium text-gray-700">ここから先は</h3>
                  </div>
                  
                  <div className="text-center mb-2">
                    <p className="text-sm text-gray-500">{prompt.wordCount}字</p>
                    <p className="text-3xl font-bold mb-2">¥ {prompt.price}</p>
                  </div>
                  
                  <div className="text-center text-sm text-blue-600 mb-6">
                    <span>Amazon Pay支払いで総額2,025万円を山分け！</span>
                    <a href="#" className="ml-2 text-blue-600 underline">詳細</a>
                  </div>
                  
                  <Button 
                    className="w-full bg-gray-900 text-white py-3 text-lg font-medium hover:bg-gray-800 mb-4"
                  >
                    購入手続きへ
                  </Button>
                  
                  <div className="flex justify-center mb-6">
                    <AvatarGroup avatars={prompt.reviewers} count={26} />
                  </div>
                  
                  <div className="flex justify-center mb-8">
                    <Link to="/login" className="text-gray-900 font-medium hover:underline">
                      ログイン
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-8">
                    {prompt.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="px-4 py-1 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Social interaction buttons */}
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center text-gray-500 hover:text-red-500 focus:outline-none">
                        <Heart className="h-6 w-6 mr-1 text-red-400" fill="#F87171" />
                        <span>{prompt.likes}</span>
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tip section */}
                  <div className="bg-gray-50 p-4 rounded-md mb-10">
                    <div className="text-center mb-4">
                      <p className="text-gray-700">この記事が気に入ったらチップで応援してみませんか？</p>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        className="bg-white border border-gray-300 text-gray-800 font-medium flex items-center space-x-1 px-5"
                      >
                        <Heart className="h-4 w-4" />
                        <span>チップで応援</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Author profile - Smaller version */}
                  <div className="border-t border-gray-200 pt-6 mb-8">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src={prompt.author.avatarUrl} 
                            alt={prompt.author.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{prompt.author.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            <span>📚新刊『発信をお金にかえる勇気』予約開始！！</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            著者、コンサルタント/『発信する勇気』（きずな出版）/ コンテンツビジネススクール主宰 / 公式メルマガ→
                            <a href={prompt.website} className="text-blue-600 hover:underline">{prompt.website}</a>
                          </p>
                          
                          <div className="flex space-x-2 mt-2">
                            {prompt.socialLinks.map((link, index) => (
                              <a key={index} href={link.url} className="text-gray-500 hover:text-gray-700">
                                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200">
                                  <span className="text-xs">{link.icon.charAt(0).toUpperCase()}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-gray-900 text-white hover:bg-gray-800 rounded-md text-xs py-1 px-3 h-auto"
                      >
                        フォロー
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
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

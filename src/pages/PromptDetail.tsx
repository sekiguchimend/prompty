
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChevronLeft, Heart, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
    tags: [
      '新刊『発信をお金にかえる勇気』予約開始！！', 
      '著者', 
      'コンサルタント', 
      '『発信する勇気』（きずな出版）', 
      'コンテンツビジネススクール主宰', 
      '公式メルマガ'
    ],
    website: 'https://hiroomisueyoshi.net/fx/m/aiimag'
  };

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
                  <div className="mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
                      <img 
                        src={prompt.author.avatarUrl} 
                        alt={prompt.author.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-medium">{prompt.author.name}</h3>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-2 mb-6">
                    {prompt.tags.map((tag, index) => (
                      <div key={index} className="flex items-center">
                        {index === 0 && <span className="mr-1">👉</span>}
                        <span>{tag}</span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <a href={prompt.website} className="text-gray-400 hover:text-gray-600">
                        {prompt.website}
                      </a>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mb-4 bg-gray-900 text-white hover:bg-gray-800 rounded-sm"
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
                      className="w-8 h-8 rounded-full mr-2" 
                    />
                    <div>
                      <p className="text-sm font-medium">{prompt.author.bio}</p>
                      <p className="text-xs text-gray-500">{prompt.author.publishedAt}</p>
                    </div>
                  </div>
                  
                  <div className="border border-gray-300 rounded-md py-1 px-4">
                    <span className="font-bold">¥{prompt.price}</span>
                  </div>
                </div>
                
                <div className="prose prose-gray max-w-none my-10 text-lg">
                  {prompt.content.map((paragraph, index) => (
                    <p key={index} className="mb-6">{paragraph}</p>
                  ))}
                </div>
                
                <div className="flex items-center justify-between border-t border-b py-4 my-8">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500">
                      <Heart className="h-5 w-5 mr-1" />
                      <span>{prompt.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-400 mr-1">♥</span>
                    <span>{prompt.likes}</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PromptDetail;

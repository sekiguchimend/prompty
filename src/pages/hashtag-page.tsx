import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
import { Button } from '../components/ui/button';
import { Facebook, Twitter, Bookmark, Share2 } from 'lucide-react';
import PromptCard from '../components/prompt-card';

// サンプルの投稿データ
const samplePosts = [
  {
    id: '1',
    title: '副業として有料記事を始めた4つの理由と月5万円稼ぐためのコツ',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?blog',
    user: {
      name: 'コンテンツクリエイター',
      avatarUrl: 'https://source.unsplash.com/random/100x100?person'
    },
    postedAt: '2023年12月24日',
    likeCount: 152
  },
  {
    id: '2',
    title: '初めての有料記事を書いてみた結果【実際の収益も公開】',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?writing',
    user: {
      name: 'マーケターAさん',
      avatarUrl: 'https://source.unsplash.com/random/100x100?portrait'
    },
    postedAt: '2023年12月22日',
    likeCount: 89
  },
  {
    id: '3',
    title: '有料記事を6ヶ月間書き続けて学んだこと',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?laptop',
    user: {
      name: 'ビジネスコンサルタント',
      avatarUrl: 'https://source.unsplash.com/random/100x100?consultant'
    },
    postedAt: '2023年12月20日',
    likeCount: 214
  },
  {
    id: '4',
    title: '初心者でも書ける！有料記事のテーマの見つけ方と構成のコツ',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?notes',
    user: {
      name: 'フリーライター',
      avatarUrl: 'https://source.unsplash.com/random/100x100?writer'
    },
    postedAt: '2023年12月18日',
    likeCount: 67
  },
  {
    id: '5',
    title: '有料記事を書いて月10万円稼ぐようになった私の執筆スタイル',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?desk',
    user: {
      name: 'デジタルノマド',
      avatarUrl: 'https://source.unsplash.com/random/100x100?nomad'
    },
    postedAt: '2023年12月15日',
    likeCount: 132
  },
  {
    id: '6',
    title: '有料記事のプロモーション方法5選【SNS活用のコツ】',
    thumbnailUrl: 'https://source.unsplash.com/random/300x200?social',
    user: {
      name: 'マーケティングエキスパート',
      avatarUrl: 'https://source.unsplash.com/random/100x100?marketing'
    },
    postedAt: '2023年12月12日',
    likeCount: 95
  }
];

// ハッシュタグごとの情報マップ
interface HashtagData {
  description: string;
  entryCount: number;
  backgroundColor: string;
}

const hashtagInfo: Record<string, HashtagData> = {
  '有料記事書いてみた': {
    description: '4月は新たな挑戦を始めるのにふさわしい月です。副収入を求める会社員の方が増えている今、あなたが副業を始めたきっかけや、実際に取り組んだリアルな体験、そして役立つノウハウといった、これから副業に挑戦する人々への道しるべとなりますので、ぜひ、あなたの経験を記事にしてシェアしてください。',
    entryCount: 60992,
    backgroundColor: 'bg-amber-500'
  },
  '春の旬食材レシピ': {
    description: '春の美味しい旬の食材を使ったレシピを共有しましょう。春野菜や春の魚など、季節の恵みを活かした自慢の一品をぜひ投稿してください。',
    entryCount: 2118,
    backgroundColor: 'bg-emerald-500'
  },
  '今日の晩酌': {
    description: '今日の晩酌に合わせたお酒やおつまみの写真、レシピを共有しましょう。お気に入りの組み合わせや隠れた名品の紹介など、お酒好きの皆さんとの交流を楽しみましょう。',
    entryCount: 4016,
    backgroundColor: 'bg-blue-500'
  },
  'イチオシのおいしい一品': {
    description: 'あなたのイチオシの美味しい料理やスイーツを紹介してください。自分で作ったものでも、お店で食べたものでも、とにかく「これは美味しい！」と思った一品を共有しましょう。',
    entryCount: 8715,
    backgroundColor: 'bg-red-500'
  }
};

const HashtagPage: React.FC = () => {
  const router = useRouter();
  const { tag } = router.query;
  const decodedTag = tag ? decodeURIComponent(tag as string) : '';
  
  // ハッシュタグ情報を取得（存在しない場合はデフォルト値）
  const hashtagData = hashtagInfo[decodedTag] || {
    description: 'このハッシュタグに関連する投稿を探索しましょう。',
    entryCount: 0,
    backgroundColor: 'bg-gray-500'
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-28 md:pt-16">
        {/* ハッシュタグのヒーローセクション */}
        <div className={`${hashtagData.backgroundColor} text-white`}>
          <div className="container mx-auto px-4 py-10 max-w-6xl">
            {/* お知らせバー */}
            <div className="bg-amber-500 text-white py-2 px-4 rounded-lg mb-6 text-center font-medium text-sm">
              ただいま作品募集中です！
            </div>
            
            <div className="mb-6">
              <span className="inline-block py-1 px-4 bg-white text-gray-800 rounded-full text-sm font-medium mb-2">
                お題
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                #{decodedTag}
              </h1>
              <p className="text-lg mb-6 max-w-3xl">
                {hashtagData.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Button className="bg-white text-black hover:bg-gray-100 rounded-full text-sm px-6 py-1.5 h-auto">
                  さっそく応募する
                </Button>
                
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Twitter className="h-4 w-4" />
                  </button>
                  <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Facebook className="h-4 w-4" />
                  </button>
                  <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2 items-center">
                  <button className="py-1.5 px-4 bg-white/10 rounded-full text-sm font-medium">
                    人気
                  </button>
                  <button className="py-1.5 px-4 bg-transparent rounded-full text-sm font-medium">
                    新着
                  </button>
                </div>
                <span className="text-sm">
                  {hashtagData.entryCount.toLocaleString()}件
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 投稿グリッド */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {samplePosts.map(post => (
              <div key={post.id}>
                <PromptCard
                  id={post.id}
                  title={post.title}
                  thumbnailUrl={post.thumbnailUrl}
                  user={post.user}
                  postedAt={post.postedAt}
                  likeCount={post.likeCount}
                />
              </div>
            ))}
          </div>
          
          {/* もっと見るボタン */}
          <div className="text-center mt-10">
            <Button variant="outline" className="rounded-full text-sm px-6">
              もっと見る
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HashtagPage; 
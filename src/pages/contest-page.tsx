import React, { useState, useEffect } from 'react';
import Footer from '../components/footer';
import { Button } from '../components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';

const ContestPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'募集中' | 'その他のお題'>('募集中');
  const [foodCounts, setFoodCounts] = useState<number[]>([]);
  const [foodCounts2, setFoodCounts2] = useState<number[]>([]);
  
  // useEffectでクライアントサイドのみでランダム値を生成
  useEffect(() => {
    // フード関連のハッシュタグ表示用の件数
    setFoodCounts([
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000)
    ]);
    
    // 2つ目のフード関連のハッシュタグ表示用の件数
    setFoodCounts2([
      Math.floor(Math.random() * 30000),
      Math.floor(Math.random() * 30000),
      Math.floor(Math.random() * 30000),
      Math.floor(Math.random() * 30000)
    ]);
  }, []);
  
  // 募集中のコンテスト情報（サンプルデータ）
  const activeContests = [
    {
      id: '1',
      hashtag: '#決算発表前に語ろう',
      description: '多くの企業が決算を迎える春に、業界や企業の展開を予想する記事を広く募集します。投稿に役立つすぐさま効果的な機能は、promptyマネーTOP、最新技術ページに掲載されやすくなる条件、メルマガやprompty公式SNSでご紹介します。',
      entryCount: 720,
      link: '/contest/financial-report'
    },
    {
      id: '2',
      hashtag: '#有料記事書いてみた',
      description: '4月は新たな挑戦を始めるのにふさわしい月です。副収入を求める会社員の方が増えている今、あなたが副業を始めたきっかけや、実際に取り組んだリアルな体験、そして役立つノウハウ/といった、これから副業に挑戦する人々への道しるべとなりますので、ぜひ、あなたの経験を記事にしてシェアしてください。',
      entryCount: 60992,
      link: '/contest/paid-articles'
    }
  ];

  // 審査中のコンテスト
  const reviewingContests = [
    {
      id: '3',
      hashtag: '#ハマった沼を語らせて',
      label: 'コンテスト',
      description: 'あなたがハマっているとやもののの魅力、好きになったきっかけについての投稿を募集します！3月16日まで【賞】グランプリには10万円分のAmazonギフトカードなど、合計3名にプレゼント！',
      entryCount: 8687,
      backgroundColor: 'bg-amber-100'
    },
    {
      id: '4',
      hashtag: '#新社会人におすすめの本',
      label: 'お題',
      sponsorName: 'with 日本経済新聞',
      description: 'みなさんが新社会人に読んでほしい本を募集します！仕事の基礎を学んだビジネス書、業界の知識が身につく専門書、困難を乗り越える勇気をくれた小説など、その紹介の際には、おすすめしたい理由も合わせて教えてください。',
      entryCount: 5375,
      backgroundColor: 'bg-blue-100'
    }
  ];

  // 過去に開催されたコンテスト
  const pastContests = [
    {
      id: '5',
      hashtag: '#推したい会社',
      imageUrl: 'https://source.unsplash.com/random/300x200?company',
      entryCount: 3074
    },
    {
      id: '6',
      hashtag: '#かなえたい夢',
      imageUrl: 'https://source.unsplash.com/random/300x200?dream',
      entryCount: 9857
    },
    {
      id: '7',
      hashtag: '#冬の1コマ',
      imageUrl: 'https://source.unsplash.com/random/300x200?winter',
      entryCount: 10587
    },
    {
      id: '8',
      hashtag: '#いい画のために',
      imageUrl: 'https://source.unsplash.com/random/300x200?art',
      entryCount: 7538
    },
    {
      id: '9',
      hashtag: '#想像して書いてみた',
      imageUrl: 'https://source.unsplash.com/random/300x200?imagination',
      entryCount: 5234
    },
    {
      id: '10',
      hashtag: '#夏の1コマ',
      imageUrl: 'https://source.unsplash.com/random/300x200?summer',
      entryCount: 9876
    }
  ];

  // ハッシュタグをクリックした時の処理
  const handleHashtagClick = (tag: string) => {
    // ハッシュタグから#を取り除く
    const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
    // 現在のページにとどまる（URLは変更しない）
    // router.push(`/hashtag/${encodeURIComponent(tagName)}`);
  };

  // コンテストをクリックした時の処理
  const handleContestClick = (contest: { hashtag: string }) => {
    // タグ名を抽出（#を取り除く）
    const tagName = contest.hashtag.startsWith('#') ? contest.hashtag.substring(1) : contest.hashtag;
    // 現在のページにとどまる
    // router.push(`/hashtag/${encodeURIComponent(tagName)}`);
  };

  // タブ切り替え処理
  const handleTabChange = (tab: '募集中' | 'その他のお題') => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pt-2 md:pt-2">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* タブナビゲーション */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex overflow-x-auto no-scrollbar">
              <button 
                className={`py-3 px-5 font-medium text-sm whitespace-nowrap ${
                  activeTab === '募集中' 
                    ? 'border-b-2 border-black text-black' 
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('募集中')}
              >
                募集中
              </button>
              <button 
                className={`py-3 px-5 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'その他のお題' 
                    ? 'border-b-2 border-black text-black' 
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('その他のお題')}
              >
                その他のお題
              </button>
            </div>
          </div>
          
          {activeTab === '募集中' ? (
            <>
              {/* コンテストセクションヘッダー */}
              <div className="flex items-center mb-6">
                <h1 className="text-xl font-bold">コンテスト・コラボ企画に参加しよう</h1>
                <div className="ml-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">?</span>
                </div>
              </div>
              
              {/* コンテストカード */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {activeContests.map(contest => (
                  <div 
                    key={contest.id} 
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col mb-4">
                        <span className="text-gray-500 text-sm mb-1">#</span>
                        <h2 
                          className="text-lg font-bold hover:text-blue-600 cursor-pointer"
                          onClick={() => handleContestClick(contest)}
                        >
                          {contest.hashtag}
                        </h2>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                        {contest.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">{contest.entryCount.toLocaleString()}件</span>
                        
                        <div className="flex gap-3">
                          <Button variant="outline" className="rounded-full text-sm px-5 py-1 h-auto">
                            応募概要
                          </Button>
                          <Button 
                            className="rounded-full bg-black hover:bg-gray-800 text-white text-sm px-5 py-1 h-auto"
                            onClick={() => handleContestClick(contest)}
                          >
                            さっそく応募
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* バナー広告 */}
              <div className="bg-emerald-600 text-white rounded-lg overflow-hidden mb-12">
                <div className="p-8 relative">
                  <div className="absolute top-0 right-0">
                    <svg width="250" height="150" viewBox="0 0 250 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M50 20 L70 40 L30 80 Z" fill="rgba(255,255,255,0.1)" />
                      <path d="M180 10 L210 40 L150 100 Z" fill="rgba(255,255,255,0.1)" />
                      <path d="M210 80 L230 100 L190 140 Z" fill="rgba(255,255,255,0.1)" />
                    </svg>
                  </div>
                  
                  <h2 className="text-xl font-bold mb-3 max-w-md relative z-10">コンテストやお題を活用して、創作のテーマを見つけよう！</h2>
                  <Button variant="outline" className="bg-white text-emerald-600 hover:bg-gray-100 rounded-full text-sm px-5 py-1.5 h-auto relative z-10 mt-4">
                    コンテスト・お題について
                  </Button>
                </div>
              </div>
              
              {/* テーマセクション */}
              <div className="mb-6">
                <div className="flex items-center mb-6">
                  <h2 className="text-xl font-bold">書きたいテーマを探してみよう</h2>
                  <div className="ml-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">?</span>
                  </div>
                </div>
                
                {/* カテゴリー：フード */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                      <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="#333"/>
                    </svg>
                    <h3 className="text-lg font-bold">フード</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['#春の旬食材レシピ', '#今日の晩酌', '#牛乳レシピ', '#手作りパン'].map((hashtag, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleHashtagClick(hashtag)}
                      >
                        <div className="flex items-start">
                          <span className="text-red-500 mr-2">#</span>
                          <div>
                            <p className="font-medium text-sm">{hashtag.substring(1)}</p>
                            <p className="text-gray-500 text-xs mt-1">{foodCounts[index] || 5000}件</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['#イチオシのおいしい一品', '#おいしいお店', '#私の朝ごはん', '#おうちカフェ'].map((hashtag, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleHashtagClick(hashtag)}
                      >
                        <div className="flex items-start">
                          <span className={`text-${['red', 'orange', 'green', 'orange'][index]}-500 mr-2`}>#</span>
                          <div>
                            <p className="font-medium text-sm">{hashtag.substring(1)}</p>
                            <p className="text-gray-500 text-xs mt-1">{foodCounts2[index] || 15000}件</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* もっと見るボタン */}
                <div className="text-center">
                  <Button variant="outline" className="rounded-full text-sm px-6">
                    もっと見る <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 審査中のコンテストセクション */}
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6">審査中</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviewingContests.map(contest => (
                    <div 
                      key={contest.id}
                      className={`${contest.backgroundColor} border border-gray-200 rounded-lg shadow-sm overflow-hidden`}
                    >
                      <div className="p-6">
                        <div className="flex flex-col mb-4">
                          <div className="inline-block px-3 py-1 bg-white text-gray-800 rounded-full text-xs font-medium mb-2 w-fit">
                            {contest.label}
                          </div>
                          <span className="text-gray-500 text-sm">#</span>
                          <h2 
                            className="text-xl font-bold hover:text-blue-600 cursor-pointer"
                            onClick={() => handleContestClick(contest)}
                          >
                            {contest.hashtag}
                          </h2>
                          {contest.sponsorName && (
                            <p className="text-sm mt-1">{contest.sponsorName}</p>
                          )}
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                          {contest.description}
                        </p>
                        
                        <div className="text-gray-600 text-sm">
                          {contest.entryCount.toLocaleString()}件
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 過去に開催されたコンテストセクション */}
              <div>
                <h2 className="text-xl font-bold mb-6">過去に開催</h2>
                <h3 className="font-bold text-lg mb-4">コンテスト</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                  {pastContests.map(contest => (
                    <div 
                      key={contest.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleContestClick(contest)}
                    >
                      <div className="relative pb-[56.25%]">
                        <img 
                          src={contest.imageUrl} 
                          alt={contest.hashtag} 
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-base mb-1">{contest.hashtag}</h4>
                        <p className="text-gray-500 text-xs">{contest.entryCount.toLocaleString()}件</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* もっと見るボタン */}
                <div className="text-center mb-12">
                  <Button variant="outline" className="rounded-full text-sm px-6">
                    もっと見る <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContestPage;
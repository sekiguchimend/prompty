
import React from 'react';
import HelpCategoryCard from './HelpCategoryCard';
import { Book, User, Newspaper, Users, HelpCircle, MoreHorizontal, Briefcase, Bot } from 'lucide-react';

// Define categories based on the image
const helpCategories = [
  {
    id: 'getting-started',
    title: 'promptyを安心して使いこなすために',
    description: '',
    icon: <Book className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'about',
    title: 'promptyについて',
    description: '初めての方はこちらから',
    icon: <HelpCircle className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'account',
    title: 'アカウント',
    description: 'アカウント情報の確認や変更、プロフィール等について',
    icon: <User className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'articles',
    title: '記事',
    description: '記事の作り方、管理方法、サポート等について',
    icon: <Newspaper className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'magazine',
    title: 'マガジン',
    description: 'マガジンの使い方、設定方法等について',
    icon: <Book className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'membership',
    title: 'メンバーシップ',
    description: 'メンバーシップの使い方、設定方法等について',
    icon: <Users className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'faq',
    title: 'よくある質問',
    description: 'よくお問い合わせいただく質問と回答をまとめました',
    icon: <HelpCircle className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'other-help',
    title: 'その他のヘルプ',
    description: 'その他の各種機能についてのヘルプはこちらにまとまっています',
    icon: <MoreHorizontal className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  },
  {
    id: 'business',
    title: 'prompty pro/その他法人向け',
    description: '',
    icon: <Briefcase className="h-6 w-6 text-prompty-primary" />,
    url: '/'
  }
];

const HelpCategoryGrid: React.FC = () => {
  return (
    <section className="w-full py-12">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map((category) => (
            <HelpCategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              url={category.url}
            />
          ))}
        </div>
        
        {/* AI Support Section */}
        <div className="mt-12 flex justify-end">
          <div className="flex items-center space-x-2 text-prompty-primary">
            <Bot className="h-10 w-10" />
            <span className="text-lg font-medium">AIサポート</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HelpCategoryGrid;

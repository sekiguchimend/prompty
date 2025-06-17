"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Twitter, Instagram, Facebook } from 'lucide-react';
import { useRouter } from 'next/router';

// 人気のタグリスト
const popularTags = [
  'Selenium',
  'BeautifulSoup',
  'Scrapy',
  'Puppeteer',
  'API連携'
];

const categories = [
  { id: 'all', name: 'すべて', active: true },
  { id: 'following', name: 'フォロー中', active: false },
  { id: 'posts', name: '投稿企画', active: false },
  { id: 'erp', name: 'ERPシステム', active: false, children: [
    { id: 'sap', name: 'SAP', active: false },
    { id: 'oracle', name: 'Oracle ERP', active: false },
    { id: 'dynamics', name: 'Microsoft Dynamics', active: false },
    { id: 'odoo', name: 'Odoo', active: false },
    { id: 'salesforce', name: 'Salesforce', active: false },
    { id: 'workday', name: 'Workday', active: false },
    { id: 'custom-erp', name: 'カスタムERP開発', active: false },
  ]},
  { id: 'scraping', name: 'スクレイピング・自動化', active: false, children: [
    { id: 'web-scraping', name: 'Webスクレイピング', active: false },
    { id: 'data-extraction', name: 'データ抽出', active: false },
    { id: 'automation', name: '自動化ツール', active: false },
    { id: 'selenium', name: 'Selenium', active: false },
    { id: 'puppeteer', name: 'Puppeteer', active: false },
    { id: 'beautifulsoup', name: 'BeautifulSoup', active: false },
    { id: 'scrapy', name: 'Scrapy', active: false },
    { id: 'rpa', name: 'RPA', active: false },
  ]},
  { id: 'data-integration', name: 'データ連携', active: false, children: [
    { id: 'etl', name: 'ETL', active: false },
    { id: 'api-integration', name: 'API連携', active: false },
    { id: 'data-pipeline', name: 'データパイプライン', active: false },
    { id: 'webhooks', name: 'Webhooks', active: false },
    { id: 'database', name: 'データベース連携', active: false },
  ]},
  { id: 'enterprise-systems', name: '業務システム', active: false, children: [
    { id: 'accounting', name: '会計システム', active: false },
    { id: 'hr', name: '人事給与', active: false },
    { id: 'crm', name: 'CRM', active: false },
    { id: 'inventory', name: '在庫管理', active: false },
    { id: 'scm', name: 'サプライチェーン', active: false },
    { id: 'bi', name: 'BI・分析', active: false },
  ]},
  { id: 'popular-tags', name: '人気タグ', active: false },
];

const Sidebar = () => {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    erp: false,
    scraping: false,
    'data-integration': false,
    'enterprise-systems': false,
    'popular-tags': false,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCategoryClick = (category: string) => {
    console.log(`カテゴリーがクリックされました: ${category}`);
    
    // カテゴリーによって異なる動作をする
    if (category === 'following') {
      console.log('フォロー中ページに遷移します');
      // フォロー中ページに遷移
      router.push('/following');
    } else if (category === 'posts') {
      console.log('投稿企画ページに遷移します');
      // 投稿企画ページに遷移
      router.push('/contest-page');
    } else if (category === 'all') {
      console.log('トップページに遷移します');
      // トップページに遷移
      router.push('/');
    } else {
      console.log(`カテゴリー ${category} を展開/折りたたみします`);
      // その他のカテゴリーは展開/折りたたみのみ行う
      setExpandedCategories({
        ...expandedCategories,
        [category]: !expandedCategories[category]
      });
    }
  };

  const handleSubCategoryClick = (subCategory: string) => {
    // サブカテゴリークリック時の処理
    // 現在は何も動作しない
    console.log(`サブカテゴリーがクリックされました: ${subCategory}`);
  };

  const handleTagClick = (tag: string) => {
    // タグクリック時の処理
    // 現在は何も動作しない
    console.log(`タグがクリックされました: ${tag}`);
  };

  return (
    <aside className="hidden md:block fixed left-0 top-[64px] w-[240px] h-[calc(100vh-64px)] flex-shrink-0 border-r bg-white overflow-y-auto scrollbar-none z-20">
      <nav className="flex flex-col h-full py-4">
        <div className="space-y-1 px-3 flex-grow">
          {categories.map(category => (
            <div key={category.id}>
              <button
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                  category.active ? 'category-active' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span>{category.name}</span>
                {category.children && (
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${
                      expandedCategories[category.id] ? 'rotate-180' : ''
                    }`} 
                  />
                )}
              </button>
              
              {category.children && expandedCategories[category.id] && (
                <div className="mt-1 space-y-1 pl-6">
                  {category.children.map(subCategory => (
                    <button
                      key={subCategory.id}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm ${
                        subCategory.active 
                          ? 'category-active' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSubCategoryClick(subCategory.id)}
                    >
                      {subCategory.name}
                    </button>
                  ))}
                </div>
              )}

              {/* タグリスト */}
              {category.id === 'popular-tags' && expandedCategories[category.id] && (
                <div className="mt-1 space-y-1 pl-6">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleTagClick(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Social Media Links Section */}
        <div className="mt-4 px-3">
          <div className="border rounded-md p-3 mb-2">
            <h3 className="text-sm font-bold mb-2">prompty公式SNS</h3>
            <div className="flex space-x-4">
              <Link href="https://x.com/Prompty2025" className="text-gray-700 hover:text-black">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="https://www.instagram.com/prompty_jp/" className="text-gray-700 hover:text-black">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1 px-1">
            <Link href="/help-center" className="block hover:underline">promptyの使い方</Link>
            <Link href="https://queue-tech.jp/" className="block hover:underline">運営会社</Link>
            <Link href="/terms" className="block hover:underline">
              <span className="mr-2">利用規約</span>
              <span>プライバシー</span>
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
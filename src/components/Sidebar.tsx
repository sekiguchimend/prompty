import React from 'react';
import { ChevronDown, Twitter, Instagram, Facebook } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  const handleCategoryClick = (categoryId: string) => {
    // カテゴリーに子要素がある場合は展開/折りたたみだけ行う
    const category = categories.find(c => c.id === categoryId);
    if (category?.children) {
      toggleCategory(categoryId);
      return;
    }

    // 特定のカテゴリーをクリックした場合の遷移処理
    switch(categoryId) {
      case 'posts':
        navigate('/contests');
        break;
      case 'following':
        navigate('/following');
        break;
      case 'all':
        navigate('/');
        break;
      default:
        // その他のカテゴリーの処理
        navigate(`/category/${categoryId}`);
        break;
    }
  };

  const handleTagClick = (tag: string) => {
    // エンコードしてURLパラメータとして渡す
    navigate(`/tag/${encodeURIComponent(tag)}`);
  };

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-[240px] h-[calc(100vh-64px)] flex-shrink-0 border-r bg-white overflow-y-auto scrollbar-none">
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
                      onClick={() => handleCategoryClick(subCategory.id)}
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
              <a href="https://twitter.com/prompty" className="text-gray-700 hover:text-black">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/prompty" className="text-gray-700 hover:text-black">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com/prompty" className="text-gray-700 hover:text-black">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1 px-1">
            <a href="/how-to-use" className="block hover:underline">promptyの使い方</a>
            <a href="/company" className="block hover:underline">運営会社</a>
            <a href="/terms" className="block hover:underline">
              <span className="mr-2">採用情報</span>
              <span className="mr-2">利用規約</span>
              <span>プライバシー</span>
            </a>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
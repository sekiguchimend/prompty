import React from 'react';
import { ChevronDown, Twitter, Instagram, Facebook } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 人気のハッシュタグリスト
const popularHashtags = [
  '有料記事書いてみた',
  '春の旬食材レシピ',
  '今日の晩酌',
  'イチオシのおいしい一品'
];

const categories = [
  { id: 'all', name: 'すべて', active: true },
  { id: 'posts', name: '投稿企画', active: false },
  { id: 'trials', name: 'やってみた', active: false },
  { id: 'living', name: 'くらし', active: false, children: [
    { id: 'home', name: '家庭', active: false },
    { id: 'food', name: 'フード', active: false },
    { id: 'lifestyle', name: 'ライフスタイル', active: false },
    { id: 'shopping', name: 'ショッピング', active: false },
    { id: 'parenting', name: '育児', active: false },
    { id: 'health', name: '健康', active: false },
    { id: 'travel', name: '旅行・おでかけ', active: false },
    { id: 'pets', name: 'ペット', active: false },
    { id: 'column', name: 'コラム・エッセイ', active: false },
    { id: 'beauty', name: '美容', active: false },
    { id: 'fashion', name: 'ファッション', active: false },
    { id: 'diy', name: 'DIY', active: false },
    { id: 'crafts', name: '造形', active: false },
    { id: 'handcrafts', name: '手芸', active: false },
    { id: 'outdoor', name: 'アウトドア', active: false },
  ]},
  { id: 'learning', name: 'まなび', active: false, children: [
    { id: 'education', name: '教育', active: false },
    { id: 'books', name: '読書', active: false },
  ]},
  { id: 'hashtags', name: '人気ハッシュタグ', active: false },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    living: false,
    learning: false,
    hashtags: false,
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
      default:
        // その他のカテゴリーの処理（今後追加予定）
        break;
    }
  };

  const handleHashtagClick = (tag: string) => {
    // エンコードしてURLパラメータとして渡す
    navigate(`/hashtag/${encodeURIComponent(tag)}`);
  };

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-[240px] h-[calc(100vh-64px)] flex-shrink-0 border-r bg-white overflow-y-auto">
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

              {/* ハッシュタグリスト */}
              {category.id === 'hashtags' && expandedCategories[category.id] && (
                <div className="mt-1 space-y-1 pl-6">
                  {popularHashtags.map(tag => (
                    <button
                      key={tag}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleHashtagClick(tag)}
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


import React from 'react';
import { ChevronDown, Twitter, Instagram, Facebook } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

const categories = [
  { id: 'all', name: 'すべて', active: true },
  { id: 'posts', name: '投稿企画', active: false },
  { id: 'trials', name: 'やってみた', active: false },
  { id: 'living', name: 'くらし', active: false, children: [
    { id: 'home', name: '家庭', active: false },
    { id: 'food', name: 'フード', active: false },
    { id: 'lifestyle', name: 'ライフスタイル', active: false },
  ]},
  { id: 'learning', name: 'まなび', active: false },
];

const Sidebar = () => {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    living: false,
    learning: false,
  });
  const isMobile = useIsMobile();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside className="hidden md:block w-[220px] flex-shrink-0 border-r bg-white">
      <nav className="flex flex-col h-full py-4">
        <div className="space-y-1 px-3 flex-grow">
          {categories.map(category => (
            <div key={category.id}>
              <button
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${
                  category.active ? 'category-active' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => category.children && toggleCategory(category.id)}
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
                    >
                      {subCategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 px-3">
          <div className="text-xs text-gray-500 space-y-1 px-1">
            <a href="/how-to-use" className="block hover:underline">使い方</a>
            <a href="/company" className="block hover:underline">運営会社</a>
            <div className="flex space-x-2">
              <a href="/terms" className="hover:underline">利用規約</a>
              <a href="/privacy" className="hover:underline">プライバシー</a>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

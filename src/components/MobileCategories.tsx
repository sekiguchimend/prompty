
import React from 'react';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const categories = [
  { id: 'all', name: 'すべて', active: true },
  { id: 'posts', name: '投稿企画', active: false },
  { id: 'trials', name: 'やってみた', active: false },
  { id: 'living', name: 'くらし', active: false },
  { id: 'beauty', name: '美容', active: false },
  { id: 'parenting', name: '育児', active: false },
  { id: 'health', name: '健康', active: false },
  { id: 'travel', name: '旅行・おでかけ', active: false },
];

const MobileCategories: React.FC = () => {
  return (
    <div className="bg-white border-b py-2 sticky top-16 z-10">
      <ScrollArea className="w-full">
        <div className="flex space-x-1 px-4 pb-0.5">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category.active 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default MobileCategories;

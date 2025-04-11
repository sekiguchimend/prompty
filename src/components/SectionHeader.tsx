import React from 'react';
import { ChevronRight, Rss, Search } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  showRssIcon?: boolean;
  showMoreLink?: boolean;
  moreLinkUrl?: string;
  horizontalScroll?: boolean;
  showSearchIcon?: boolean;
  onSearchClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showRssIcon = false,
  showMoreLink = false,
  moreLinkUrl = '#',
  horizontalScroll = false,
  showSearchIcon = false,
  onSearchClick = () => {},
}) => {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center">
        <h2 className="text-lg font-bold">{title}</h2>
        {showMoreLink && (
          <a href={moreLinkUrl} className="ml-2 flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ChevronRight className="h-4 w-4" />
          </a>
        )}
      </div>
      
      {/* 検索アイコン（中央に配置） */}
      <div className="flex-1 flex justify-center">
        {showSearchIcon && (
          <button 
            onClick={onSearchClick}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="検索"
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* 右側のRSSアイコン */}
      <div>
        {showRssIcon && (
          <a href="/rss" className="text-gray-500 hover:text-gray-700">
            <Rss className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;

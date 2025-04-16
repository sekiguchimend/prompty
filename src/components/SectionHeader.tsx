import React from 'react';
import { ChevronRight, Rss, Search } from 'lucide-react';
import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  showRssIcon?: boolean;
  showMoreLink?: boolean;
  moreLinkUrl?: string;
  categoryUrl?: string; // カテゴリページへのURL
  horizontalScroll?: boolean;
  showSearchIcon?: boolean;
  onSearchClick?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showRssIcon = false,
  showMoreLink = false,
  moreLinkUrl = '#',
  categoryUrl,
  horizontalScroll = false,
  showSearchIcon = false,
  onSearchClick = () => {},
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        {categoryUrl ? (
          <Link href={categoryUrl} className="group">
            <h2 className="text-lg font-bold group-hover:text-gray-700 transition-colors flex items-center">
              {title}
              <ChevronRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h2>
          </Link>
        ) : (
          <h2 className="text-lg font-bold">{title}</h2>
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
          <Link href="/rss" className="text-gray-500 hover:text-gray-700">
            <Rss className="h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;

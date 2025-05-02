import React from 'react';
import { ChevronRight, Rss, Search } from 'lucide-react';
import Link from 'next/link';
import { notoSansJP } from '../../lib/fonts'; // パスは調整

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
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center">
        {categoryUrl ? (
          <Link href={categoryUrl} className="group">
            <h2 className={`text-xl font-extrabold	 text-gray-700 tracking-tight leading-tight flex items-center ${notoSansJP.className}`}>

            {/* <h2 className="text-lg font-bold group-hover:text-gray-700 transition-colors flex items-center"> */}
              {title}

              <ChevronRight className="h-4 w-4 ml-1 text-gray-400" strokeWidth={3} />
              </h2>

          </Link>
        ) : (
          // <h2 className="text-lg font-bold">{title}</h2>
          <h2 className="text-xl font-extrabold text-gray-700 tracking-tight leading-tight">
            {title}
          </h2>
        )}
     
      </div>
   
    </div>
  );
};

export default SectionHeader;

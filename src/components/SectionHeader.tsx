
import React from 'react';
import { ChevronRight, Rss } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  showRssIcon?: boolean;
  showMoreLink?: boolean;
  moreLinkUrl?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showRssIcon = false,
  showMoreLink = false,
  moreLinkUrl = '#',
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
      {showRssIcon && (
        <a href="/rss" className="text-gray-500 hover:text-gray-700">
          <Rss className="h-5 w-5" />
        </a>
      )}
    </div>
  );
};

export default SectionHeader;

import React from 'react';
import SectionHeader from './section-header';
import PromptGrid, { PromptItem } from './prompt-grid';

interface PromptSectionProps {
  title: string;
  prompts: PromptItem[];
  showMoreLink?: boolean;
  showRssIcon?: boolean;
  sectionPrefix?: string;
  horizontalScroll?: boolean;
  maxVisible?: number;
  className?: string;
  categoryUrl?: string;
  moreLinkUrl?: string;
  showViewAll?: boolean;
  isFeatureSection?: boolean;
}

const PromptSection: React.FC<PromptSectionProps> = ({ 
  title, 
  prompts, 
  showMoreLink = false, 
  showRssIcon = false,
  sectionPrefix = '',
  horizontalScroll = false,
  maxVisible,
  className = '',
  categoryUrl,
  moreLinkUrl,
  showViewAll = true,
  isFeatureSection = false
}) => {
  return (
    <section className={`mt-4 first:mt-0 ${className}`}>
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
        horizontalScroll={horizontalScroll}
        categoryUrl={categoryUrl}
        moreLinkUrl={moreLinkUrl || categoryUrl}
      />
      <div className="mt-2">
        {prompts && prompts.length > 0 ? (
          <PromptGrid 
            prompts={prompts} 
            sectionPrefix={sectionPrefix} 
            horizontalScroll={horizontalScroll}
            categoryPath={categoryUrl}
            showViewAll={showViewAll}
            isFeatureSection={isFeatureSection}
          />
        ) : (
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-gray-500 text-center">
              {title}の記事はまだありません。
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PromptSection;

import React from 'react';
import SectionHeader from './SectionHeader';
import PromptGrid, { PromptItem } from './PromptGrid';

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
  moreLinkUrl
}) => {
  return (
    <section className={`mt-6 md:mt-8 first:mt-0 ${className}`}>
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
        horizontalScroll={horizontalScroll}
        categoryUrl={categoryUrl}
        moreLinkUrl={moreLinkUrl || categoryUrl}
      />
      <PromptGrid 
        prompts={prompts} 
        sectionPrefix={sectionPrefix} 
        horizontalScroll={horizontalScroll}
        categoryPath={categoryUrl} 
      />
    </section>
  );
};

export default PromptSection;

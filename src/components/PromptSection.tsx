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
  const visiblePrompts = maxVisible ? prompts.slice(0, maxVisible) : prompts;
  
  return (
    <section className={`mt-8 md:mt-10 first:mt-0 ${className}`}>
      {/* <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
        horizontalScroll={horizontalScroll}
        categoryUrl={categoryUrl}
        moreLinkUrl={moreLinkUrl || categoryUrl}
      /> */}
      <PromptGrid 
        prompts={visiblePrompts} 
        sectionPrefix={sectionPrefix} 
        horizontalScroll={horizontalScroll} 
      />
    </section>
  );
};

export default PromptSection;

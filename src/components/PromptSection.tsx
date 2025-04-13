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
}

const PromptSection: React.FC<PromptSectionProps> = ({ 
  title, 
  prompts, 
  showMoreLink = false, 
  showRssIcon = false,
  sectionPrefix = '',
  horizontalScroll = false,
  maxVisible
}) => {
  const visiblePrompts = maxVisible ? prompts.slice(0, maxVisible) : prompts;
  
  return (
    <section className="mt-8 first:mt-0">
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
        horizontalScroll={horizontalScroll}
      />
      <PromptGrid 
        prompts={visiblePrompts} 
        sectionPrefix={sectionPrefix} 
        horizontalScroll={horizontalScroll} 
      />
    </section>
  );
};

export default PromptSection;

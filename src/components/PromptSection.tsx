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
}

const PromptSection: React.FC<PromptSectionProps> = ({ 
  title, 
  prompts, 
  showMoreLink = false, 
  showRssIcon = false,
  sectionPrefix = '',
  horizontalScroll = false
}) => {
  return (
    <section className="mt-12 first:mt-0">
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
        horizontalScroll={horizontalScroll}
      />
      <PromptGrid prompts={prompts} sectionPrefix={sectionPrefix} horizontalScroll={horizontalScroll} />
    </section>
  );
};

export default PromptSection;


import React from 'react';
import SectionHeader from './SectionHeader';
import PromptGrid, { PromptItem } from './PromptGrid';

interface PromptSectionProps {
  title: string;
  prompts: PromptItem[];
  showMoreLink?: boolean;
  showRssIcon?: boolean;
  sectionPrefix?: string;
}

const PromptSection: React.FC<PromptSectionProps> = ({ 
  title, 
  prompts, 
  showMoreLink = false, 
  showRssIcon = false,
  sectionPrefix = ''
}) => {
  return (
    <section className="mt-12 first:mt-0">
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
      />
      <PromptGrid prompts={prompts} sectionPrefix={sectionPrefix} />
    </section>
  );
};

export default PromptSection;

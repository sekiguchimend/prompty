
import React from 'react';
import SectionHeader from './SectionHeader';
import PromptGrid, { PromptItem } from './PromptGrid';
import { useIsMobile } from '../hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  return (
    <section className="mt-6 first:mt-0">
      <SectionHeader 
        title={title} 
        showMoreLink={showMoreLink} 
        showRssIcon={showRssIcon} 
      />
      <PromptGrid 
        prompts={isMobile ? prompts.slice(0, 3) : prompts} 
        sectionPrefix={sectionPrefix} 
      />
    </section>
  );
};

export default PromptSection;

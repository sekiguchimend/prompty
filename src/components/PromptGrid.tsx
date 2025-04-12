import React from 'react';
import PromptCard from './PromptCard';

export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  postedAt: string;
  likeCount: number;
}

interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
}

const PromptGrid: React.FC<PromptGridProps> = ({ prompts, sectionPrefix = '', horizontalScroll = false }) => {
  const gridClasses = horizontalScroll
    ? "flex overflow-x-auto pb-4 space-x-4 hide-scrollbar"
    : "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  const cardClasses = horizontalScroll
    ? "w-[80%] max-w-[280px] flex-shrink-0"
    : "";

  const scrollbarHideStyle = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;     /* Firefox */
    }
  `;

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      
      <div className={gridClasses}>
        {prompts.map(prompt => (
          <div key={`${sectionPrefix}${prompt.id}`} className={cardClasses}>
            <PromptCard
              id={sectionPrefix ? `${sectionPrefix}-${prompt.id}` : prompt.id}
              title={prompt.title}
              thumbnailUrl={prompt.thumbnailUrl}
              user={prompt.user}
              postedAt={prompt.postedAt}
              likeCount={prompt.likeCount}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default PromptGrid;

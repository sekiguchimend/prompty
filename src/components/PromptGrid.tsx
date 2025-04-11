
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
}

const PromptGrid: React.FC<PromptGridProps> = ({ prompts, sectionPrefix = '' }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {prompts.map(prompt => (
        <PromptCard
          key={`${sectionPrefix}${prompt.id}`}
          id={sectionPrefix ? `${sectionPrefix}-${prompt.id}` : prompt.id}
          title={prompt.title}
          thumbnailUrl={prompt.thumbnailUrl}
          user={prompt.user}
          postedAt={prompt.postedAt}
          likeCount={prompt.likeCount}
        />
      ))}
    </div>
  );
};

export default PromptGrid;

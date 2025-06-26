import React, { forwardRef, memo } from 'react';
import { PromptItem } from '../../types/components';
import OptimizedPromptCard from '../common/OptimizedPromptCard';
import { ViewAllCard } from './ViewAllCard';
import { cn } from '../../lib/utils';

interface PromptCardGridProps {
  prompts: PromptItem[];
  horizontalScroll: boolean;
  isFeatureSection: boolean;
  showViewAll: boolean;
  categoryPath: string;
  sectionPrefix: string;
  onHidePrompt: (id: string) => void;
  className?: string;
}

export const PromptCardGrid = memo(forwardRef<HTMLDivElement, PromptCardGridProps>(({
  prompts,
  horizontalScroll,
  isFeatureSection,
  showViewAll,
  categoryPath,
  sectionPrefix,
  onHidePrompt,
  className,
}, ref) => {
  // グリッドクラスの設定
  const gridClasses = horizontalScroll
    ? 'flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';

  // カードの共通クラス
  const cardClasses = horizontalScroll
    ? 'flex-none w-64 snap-start'
    : '';

  return (
    <div
      ref={ref}
      className={cn(gridClasses, className)}
    >
      {/* プロンプトカード */}
      {prompts.map((prompt) => (
        <div key={prompt.id} className={cardClasses}>
          <OptimizedPromptCard
            id={prompt.id}
            title={prompt.title}
            thumbnailUrl={prompt.thumbnailUrl}
            mediaType={prompt.mediaType}
            user={prompt.user}
            postedAt={prompt.postedAt}
            likeCount={prompt.likeCount}
            isLiked={prompt.isLiked}
            isBookmarked={prompt.isBookmarked}
            onHide={onHidePrompt}
            isFeatureSection={isFeatureSection}
          />
        </div>
      ))}

      {/* すべて見るカード */}
      {showViewAll && categoryPath && (
        <div className={cardClasses}>
          <ViewAllCard
            categoryPath={categoryPath}
            sectionPrefix={sectionPrefix}
            className="h-[340px]"
          />
        </div>
      )}
    </div>
  );
}));

PromptCardGrid.displayName = 'PromptCardGrid'; 
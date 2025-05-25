import React, { memo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';
import { Button } from '../ui/button';

interface ScrollControlsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  className?: string;
}

export const ScrollControls: React.FC<ScrollControlsProps> = memo(({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  className,
}) => {
  return (
    <>
      {/* 左スクロールボタン */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${className}`}
          onClick={onScrollLeft}
          aria-label="左にスクロール"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
      )}

      {/* 右スクロールボタン */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${className}`}
          onClick={onScrollRight}
          aria-label="右にスクロール"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      )}
    </>
  );
});

ScrollControls.displayName = 'ScrollControls'; 
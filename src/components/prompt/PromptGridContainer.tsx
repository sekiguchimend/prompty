import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PromptItem, CategoryContent } from '../../types/components';
import { PromptCardGrid } from './PromptCardGrid';
import { ViewAllCard } from './ViewAllCard';
import { ScrollControls } from './ScrollControls';
import { useScrollContainer } from '../../hooks/useScrollContainer';
import { storageService } from '../../lib/storage-service';

interface PromptGridContainerProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
  categoryPath?: string;
  showViewAll?: boolean;
  isFeatureSection?: boolean;
  onHidePrompt?: (id: string) => void;
}

export const PromptGridContainer: React.FC<PromptGridContainerProps> = ({
  prompts,
  sectionPrefix = '',
  horizontalScroll = false,
  categoryPath = '',
  showViewAll = true,
  isFeatureSection = false,
  onHidePrompt,
}) => {
  const [hiddenPrompts, setHiddenPrompts] = useState<string[]>([]);
  
  // カスタムフックでスクロール機能を管理
  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    handleScroll,
  } = useScrollContainer();

  // 統合サービスから非表示リストを読み込み（最適化）
  useEffect(() => {
    setHiddenPrompts(storageService.getHiddenPosts());
  }, []);

  // 非表示処理（最適化: 統合サービス使用）
  const handleHidePrompt = useCallback((id: string) => {
    try {
      storageService.addHiddenPost(id);
      setHiddenPrompts(storageService.getHiddenPosts());
      onHidePrompt?.(id);
    } catch (error) {
      console.error('非表示処理エラー:', error);
    }
  }, [onHidePrompt]);

  // フィルタされたプロンプト
  const visiblePrompts = useMemo(() => {
    return prompts.filter(prompt => !hiddenPrompts.includes(prompt.id));
  }, [prompts, hiddenPrompts]);

  if (visiblePrompts.length === 0 && !showViewAll) {
    return null;
  }

  return (
    <div className="relative">
      {/* 横スクロール時のコントロール */}
      {horizontalScroll && (
        <ScrollControls
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => handleScroll('left')}
          onScrollRight={() => handleScroll('right')}
        />
      )}

      {/* プロンプトグリッド */}
      <PromptCardGrid
        ref={containerRef}
        prompts={visiblePrompts}
        horizontalScroll={horizontalScroll}
        isFeatureSection={isFeatureSection}
        onHidePrompt={handleHidePrompt}
        showViewAll={showViewAll}
        categoryPath={categoryPath}
        sectionPrefix={sectionPrefix}
      />
    </div>
  );
}; 
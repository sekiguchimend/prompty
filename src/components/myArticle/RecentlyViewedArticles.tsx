// components/RecentlyViewedArticles.tsx
import React, { useState, useEffect } from 'react';
import { getRecentlyViewedPrompts } from '../../lib/recently-viewed-service';
import PromptGrid from '../prompt-grid';
import { PromptItem } from '../../pages/prompts/[id]';
import { LoadingSpinner } from '../ui/loading-spinner';
import { useAuth } from '../../lib/auth-context';

const RecentlyViewedArticles: React.FC = () => {
  const [recentlyViewedPrompts, setRecentlyViewedPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchRecentlyViewedPrompts = async () => {
      if (isAuthLoading) return;
      
      if (!user) {
        setIsLoading(false);
        setError('閲覧履歴を表示するにはログインしてください');
        return;
      }

      setIsLoading(true);
      try {
        const result = await getRecentlyViewedPrompts(10);
        if (result.success && result.data) {
          setRecentlyViewedPrompts(result.data);
        } else {
          setError('最近見た記事の取得に失敗しました');
        }
      } catch (err) {
        console.error('最近見た記事取得エラー:', err);
        setError('最近見た記事の読み込み中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentlyViewedPrompts();
  }, [user, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>{error}</p>
      </div>
    );
  }

  if (recentlyViewedPrompts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>最近見た記事はありません</p>
        <p className="text-sm mt-2">記事を閲覧すると、ここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="recently-viewed-articles">
      <PromptGrid
        prompts={recentlyViewedPrompts}
        sectionPrefix="recently-viewed"
        horizontalScroll={true}
        showViewAll={false}
      />
    </div>
  );
};

export default RecentlyViewedArticles;
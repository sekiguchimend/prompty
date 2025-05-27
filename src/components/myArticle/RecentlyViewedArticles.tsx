// components/RecentlyViewedArticles.tsx
import React, { useState, useEffect } from 'react';
import { getRecentlyViewedPrompts } from '../../lib/recently-viewed-service';
import { PromptItem } from '../../pages/prompts/[id]';
import { useAuth } from '../../lib/auth-context';
import { Clock, FileText } from 'lucide-react';
import Image from 'next/image';

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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
      </div>
    );
  }

  if (recentlyViewedPrompts.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">最近見た記事はありません</h3>
        <p className="text-gray-600 mb-6">記事を閲覧すると、ここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{recentlyViewedPrompts.length} 件の最近見た記事</h2>
      </div>
      
      {/* 記事リスト */}
      <div className="space-y-3 md:space-y-4">
        {recentlyViewedPrompts.map((prompt) => (
          <div 
            key={prompt.id} 
            className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => window.location.href = `/prompts/${prompt.id}`}
          >
            {/* サムネイル */}
            <div className="flex-shrink-0">
              {prompt.thumbnailUrl ? (
                <div className="relative w-16 h-12 md:w-24 md:h-16 rounded-md overflow-hidden">
                  <Image 
                    src={prompt.thumbnailUrl}
                    alt={prompt.title}
                    fill
                    sizes="(max-width: 768px) 64px, 96px"
                    style={{ objectFit: 'cover' }}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-16 h-12 md:w-24 md:h-16 bg-gray-100 rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* コンテンツ */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">
                {prompt.title}
              </h3>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                  <span>by {prompt.user.name}</span>
                  <span>{prompt.postedAt}</span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm">閲覧済み</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedArticles;
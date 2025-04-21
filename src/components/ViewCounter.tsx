import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { getViewCount } from '../lib/analytics';

interface ViewCounterProps {
  promptId: string;
  className?: string;
}

const ViewCounter: React.FC<ViewCounterProps> = ({ promptId, className = '' }) => {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!promptId) return;

    const fetchViewCount = async () => {
      setIsLoading(true);
      try {
        console.log('閲覧数を取得中:', promptId);
        const count = await getViewCount(promptId);
        console.log('取得した閲覧数:', count);
        setViewCount(count);
      } catch (error) {
        console.error('閲覧数の取得中にエラーが発生しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewCount();

    // オプション: 定期的に更新したい場合はインターバルを設定
    // const interval = setInterval(fetchViewCount, 60000); // 1分ごとに更新
    // return () => clearInterval(interval);
  }, [promptId]);

  return (
    <div className={`flex items-center text-sm ${className}`}>
      <Eye className="h-4 w-4 mr-1 text-gray-500" />
      {isLoading ? (
        <span className="text-gray-400">...</span>
      ) : (
        <span className="text-gray-600 font-medium">
          {viewCount?.toLocaleString() || '0'} views
        </span>
      )}
    </div>
  );
};

export default ViewCounter; 
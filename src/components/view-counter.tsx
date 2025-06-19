import React, { useEffect, useState, useRef } from 'react';
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
        console.log('🔍 ViewCounter: Fetching view count for:', promptId);
        
        // データベースから常に最新の値を取得（キャッシュなし）
        const count = await getViewCount(promptId);
        
        console.log('📊 ViewCounter: Retrieved count:', count);
        setViewCount(count);
      } catch (error) {
        console.error('❌ 閲覧数の取得中にエラーが発生しました:', error);
        setViewCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    // 初回取得
    fetchViewCount();
    
    // ビュー数更新を待ってから再取得
    const timer = setTimeout(() => {
      console.log('🔄 ViewCounter: Refetching view count after delay');
      fetchViewCount();
    }, 3000); // 3秒後に再取得（DB更新の確実な反映を待つ）

    return () => clearTimeout(timer);
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
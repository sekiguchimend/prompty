import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Eye, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface ViewStatsCardProps {
  promptId?: string; // 特定の記事の閲覧数を表示する場合
  userId?: string; // ユーザーの全記事の閲覧数を表示する場合
  className?: string;
}

const ViewStatsCard: React.FC<ViewStatsCardProps> = ({ 
  promptId, 
  userId, 
  className = '' 
}) => {
  const [totalViews, setTotalViews] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [trend, setTrend] = useState<number>(0); // 前回比の変化率(%)

  useEffect(() => {
    const fetchViewStats = async () => {
      setIsLoading(true);
      
      try {
        // 特定の記事の閲覧数を取得
        if (promptId) {
          const { count, error } = await supabase
            .from('analytics_views')
            .select('id', { count: 'exact', head: true })
            .eq('prompt_id', promptId);
          
          if (error) throw error;
          setTotalViews(count || 0);
        } 
        // ユーザーの全記事の閲覧数を取得
        else if (userId) {
          // プロンプトテーブルからユーザーの記事IDを取得
          const { data: promptsData, error: promptsError } = await supabase
            .from('prompts')
            .select('id')
            .eq('author_id', userId);
          
          if (promptsError) throw promptsError;
          
          if (promptsData && promptsData.length > 0) {
            // 取得した記事IDに基づいて総閲覧数をカウント
            const promptIds = promptsData.map(p => p.id);
            const { count, error } = await supabase
              .from('analytics_views')
              .select('id', { count: 'exact', head: true })
              .in('prompt_id', promptIds);
            
            if (error) throw error;
            setTotalViews(count || 0);
          }
        }
        
        // トレンド計算のサンプル（本来は日付範囲で比較するロジックが必要）
        // 現状は固定値を設定
        setTrend(0); // 変化なし
        
      } catch (error) {
        console.error('閲覧統計の取得中にエラーが発生しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewStats();
  }, [promptId, userId]);

  // トレンドアイコンを表示
  const renderTrendIcon = () => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">閲覧数</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {isLoading ? (
            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
              <div className="flex items-center mt-1 text-xs">
                {renderTrendIcon()}
                <span className={`ml-1 ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {trend > 0 ? '+' : ''}{trend}% 先週比
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewStatsCard; 
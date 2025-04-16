import React, { useState } from 'react';
import { Button } from '../ui/button';
import { MoreHorizontal, Heart, MessageSquare, Eye, Edit, BarChart3, MoreVertical, Clock, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

interface Content {
  id: string;
  title: string;
  imageUrl?: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  isPublished: boolean;
  isPremium: boolean;
}

interface ContentsListProps {
  contents: Content[];
}

type FilterType = 'すべて' | '公開済み' | '下書き' | '有料';

const ContentsList: React.FC<ContentsListProps> = ({ contents }) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('すべて');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 表示するコンテンツをフィルタリング
  const getFilteredContents = () => {
    let filtered = [...contents];
    
    // フィルターを適用
    switch (selectedFilter) {
      case '公開済み':
        filtered = filtered.filter(content => content.isPublished);
        break;
      case '下書き':
        filtered = filtered.filter(content => !content.isPublished);
        break;
      case '有料':
        filtered = filtered.filter(content => content.isPremium);
        break;
    }
    
    // ソートを適用 (ダミーソート - 実際はもっと複雑なロジックになるはず)
    return filtered.sort((a, b) => {
      // ビュー数でソート
      return sortOrder === 'desc' 
        ? b.views - a.views 
        : a.views - b.views;
    });
  };

  return (
    <div className="space-y-6">
      {/* フィルター＆アクションバー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-md shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedFilter === 'すべて' 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSelectedFilter('すべて')}
          >
            すべて
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedFilter === '公開済み' 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSelectedFilter('公開済み')}
          >
            公開済み
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedFilter === '下書き' 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSelectedFilter('下書き')}
          >
            下書き
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedFilter === '有料' 
                ? 'bg-gray-900 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setSelectedFilter('有料')}
          >
            有料
          </button>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-md text-sm h-9 border-gray-200 bg-white hover:bg-gray-50 w-full sm:w-auto"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Clock className="h-4 w-4 mr-2" />
            並び替え
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-md border-gray-200 bg-white hover:bg-gray-50 h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>すべて選択</DropdownMenuItem>
              <DropdownMenuItem>選択削除</DropdownMenuItem>
              <DropdownMenuItem>CSVでエクスポート</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* コンテンツリスト */}
      <div className="space-y-4">
        {getFilteredContents().length > 0 ? (
          getFilteredContents().map((content) => (
            <div key={content.id} className="bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row">
                {content.imageUrl && (
                  <div className="sm:w-36 h-full flex-shrink-0">
                    <img 
                      src={content.imageUrl} 
                      alt={content.title} 
                      className="w-full h-full object-cover sm:h-full h-48"
                    />
                  </div>
                )}
                
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">{content.title}</h3>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>編集</DropdownMenuItem>
                        <DropdownMenuItem>複製</DropdownMenuItem>
                        <DropdownMenuItem>非公開にする</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">削除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                      content.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        content.isPublished ? 'bg-green-600' : 'bg-gray-500'
                      }`}></span>
                      {content.isPublished ? '公開中' : '下書き'}
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {content.publishedAt}
                    </div>
                    
                    {content.isPremium && (
                      <div className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full">
                        有料
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                    <div className="flex items-center text-gray-700">
                      <div className="p-1.5 bg-gray-100 rounded-full mr-2">
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm">{content.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <div className="p-1.5 bg-gray-100 rounded-full mr-2">
                        <Heart className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm">{content.likes.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <div className="p-1.5 bg-gray-100 rounded-full mr-2">
                        <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm">{content.comments.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="h-8 rounded-md bg-black hover:bg-gray-800 text-white">
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      編集
                    </Button>
                    
                    <Button variant="outline" size="sm" className="h-8 rounded-md border-gray-200">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                      統計
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <MoreHorizontal className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">該当するコンテンツがありません</p>
            <p className="text-sm text-gray-400">別のフィルターを試してみてください</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentsList; 
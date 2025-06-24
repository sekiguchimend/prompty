import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Plus, Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../ui/use-toast';
import Link from 'next/link';
import PromptManagementCard from './PromptManagementCard';
import { PromptManagementService } from '../../lib/prompt-management-service';

interface PromptData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  media_type: 'image' | 'video';
  published: boolean;
  is_free: boolean;
  price: number;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const PromptManagementList: React.FC = () => {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');

  // データを取得
  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const result = await PromptManagementService.getUserPrompts();
      
      if (result.success) {
        setPrompts(result.data);
      } else {
        toast({
          title: "エラー",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  // フィルタリング処理
  const filteredPrompts = prompts.filter(prompt => {
    // 検索フィルタ
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()));

    // ステータスフィルタ
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'published' && prompt.published) ||
                         (statusFilter === 'unpublished' && !prompt.published);

    return matchesSearch && matchesStatus;
  });

  // 統計データ
  const stats = {
    total: prompts.length,
    published: prompts.filter(p => p.published).length,
    unpublished: prompts.filter(p => !p.published).length,
    totalViews: prompts.reduce((sum, p) => sum + p.view_count, 0),
    totalLikes: prompts.reduce((sum, p) => sum + p.like_count, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">記事を読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">記事管理</h1>
          <p className="text-gray-600 mt-1">
            投稿した記事の公開状態を管理し、編集や削除を行えます
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/create-post">
            <Plus className="h-4 w-4 mr-2" />
            新しい記事を作成
          </Link>
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">総記事数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-sm text-gray-600">公開中</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-600">{stats.unpublished}</div>
          <div className="text-sm text-gray-600">非公開</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
          <div className="text-sm text-gray-600">総ビュー数</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
          <div className="text-sm text-gray-600">総いいね数</div>
        </div>
      </div>

      {/* フィルタリング */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="記事のタイトルや説明を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* ステータスフィルタ */}
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'published' | 'unpublished')}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="published">公開中のみ</SelectItem>
                <SelectItem value="unpublished">非公開のみ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* フィルタ結果表示 */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredPrompts.length}件の記事が見つかりました
          </span>
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              検索: "{searchTerm}"
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {statusFilter === 'published' ? '公開中のみ' : '非公開のみ'}
            </Badge>
          )}
        </div>
      </div>

      {/* 記事一覧 */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <Filter className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">条件に一致する記事が見つかりませんでした</p>
                <p className="text-sm">検索条件やフィルタを変更してください</p>
              </>
            ) : (
              <>
                <Plus className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">まだ記事を投稿していません</p>
                <p className="text-sm">最初の記事を作成してみましょう</p>
              </>
            )}
          </div>
          {prompts.length === 0 && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/create-post">
                <Plus className="h-4 w-4 mr-2" />
                記事を作成する
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <PromptManagementCard
              key={prompt.id}
              prompt={prompt}
              onUpdate={fetchPrompts}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptManagementList; 
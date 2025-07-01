import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useToast } from '../ui/use-toast';
import {
  MoreVertical,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Heart,
  BarChart3,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { PromptManagementService } from '../../lib/prompt-management-service';
import { PromptManagementData } from '../../types/prompt-management';
import VideoPlayer from '../common/VideoPlayer';
import LazyImage from '../common/LazyImage';

interface PromptManagementCardProps {
  prompt: PromptManagementData;
  onUpdate: () => void; // データ更新時のコールバック
}

const PromptManagementCard: React.FC<PromptManagementCardProps> = ({
  prompt,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 公開状態を切り替える
  const handleTogglePublished = async () => {
    setIsToggling(true);
    try {
      const result = prompt.published
        ? await PromptManagementService.unpublishPrompt(prompt.id)
        : await PromptManagementService.publishPrompt(prompt.id);

      if (result.success) {
        toast({
          title: prompt.published ? "非公開に設定" : "公開に設定",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // データを再取得
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
        description: "処理中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  // 削除実行
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await PromptManagementService.deletePrompt(prompt.id);

      if (result.success) {
        toast({
          title: "削除完了",
          description: result.message,
          variant: "default",
        });
        onUpdate(); // データを再取得
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
        description: "削除中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200 h-[400px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{prompt.title}</h3>
                <Badge 
                  variant={prompt.published ? "default" : "secondary"}
                  className={prompt.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                >
                  {prompt.published ? "公開中" : "非公開"}
                </Badge>
              </div>
              
              {prompt.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{prompt.description}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/prompts/${prompt.id}`} className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    プレビュー
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/edit-prompt/${prompt.id}`} className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleTogglePublished}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : prompt.published ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {prompt.published ? "非公開にする" : "公開する"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          {/* サムネイル */}
          {prompt.thumbnail_url && (
            <div className="mb-4">
              {prompt.media_type === 'video' ? (
                <VideoPlayer
                  src={prompt.thumbnail_url}
                  alt={prompt.title}
                  className="w-full h-32 object-cover rounded-lg"
                  hoverToPlay={false}
                  tapToPlay={false}
                  muted={true}
                  loop={false}
                  showThumbnail={true}
                  minimumOverlay={true}
                />
              ) : (
                <LazyImage 
                  src={prompt.thumbnail_url} 
                  alt={prompt.title}
                  className="w-full h-32 object-cover rounded-lg"
                  loading="lazy"
                  sizes="200px"
                />
              )}
            </div>
          )}

          {/* 統計情報 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>{prompt.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{prompt.like_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(prompt.created_at)}</span>
            </div>
          </div>

          {/* カテゴリと価格 */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              {prompt.categories && (
                <Badge variant="outline" className="text-xs">
                  {prompt.categories.name}
                </Badge>
              )}
            </div>
            <div className="text-sm font-medium">
              {prompt.is_free ? (
                <span className="text-green-600">無料</span>
              ) : (
                <span className="text-blue-600">¥{prompt.price?.toLocaleString()}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{prompt.title}」を完全に削除します。
              この操作は取り消すことができません。
              関連するいいね、コメント、ブックマークも削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除する"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PromptManagementCard; 
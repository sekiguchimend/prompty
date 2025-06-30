import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/auth-context';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ChevronLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import ThumbnailUploader from '../../components/create-post/ThumbnailUploader';

// プロンプトデータの型定義
interface PromptData {
  id: string;
  title: string;
  description: string | null;
  prompt_title: string;
  prompt_content: string;
  author_id: string;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  published: boolean;
  ai_model: string | null;
  category_id: string | null;
  project_url: string | null;
  created_at: string;
  updated_at: string | null;
}

interface EditPromptPageProps {
  promptData: PromptData;
}

// サーバーサイドでプロンプトデータを取得
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  
  if (!id) {
    return { notFound: true };
  }

  try {
    // 環境変数チェック
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return { notFound: true };
    }

    const { data: promptData, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !promptData) {
      console.error("プロンプト取得エラー:", error);
      return { notFound: true };
    }

    return {
      props: { promptData }
    };
  } catch (e) {
    console.error("エラー:", e);
    return { notFound: true };
  }
};

const EditPromptPage: React.FC<EditPromptPageProps> = ({ promptData }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    title: promptData.title || '',
    description: promptData.description || '',
    promptTitle: promptData.prompt_title || '',
    promptContent: promptData.prompt_content || '',
    price: promptData.price || 0,
    isFree: promptData.is_free,
    aiModel: promptData.ai_model || '',
    thumbnailUrl: promptData.thumbnail_url || null,
    thumbnailFile: null as File | null,
  });

  // 認証チェック
  useEffect(() => {
    console.log('認証状態チェック:', { 
      authLoading, 
      user: !!user, 
      userId: user?.id, 
      authorId: promptData.author_id 
    });

    // 認証状態の確認中は何もしない
    if (authLoading) {
      console.log('認証確認中...');
      return;
    }

    // ユーザーがログインしていない場合
    if (!user) {
      console.log('ユーザーがログインしていません');
      setAuthError("ログインが必要です");
      setPageLoading(false);
      // ログインページに3秒後に遷移
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(`/edit-prompt/${promptData.id}`)}`);
      }, 3000);
      return;
    }
    
    // 権限チェック
    if (user.id !== promptData.author_id) {
      console.log('権限なし:', { userId: user.id, authorId: promptData.author_id });
      setAuthError("このプロンプトを編集する権限がありません");
      setPageLoading(false);
      // 詳細ページに3秒後に遷移
      setTimeout(() => {
        router.push(`/prompts/${promptData.id}`);
      }, 3000);
      return;
    }

    // 認証と権限の確認が完了
    console.log('認証・権限確認完了');
    setCanEdit(true);
    setPageLoading(false);
    setAuthError(null);
  }, [user, authLoading, promptData.author_id, promptData.id, router]);

  // フォーム更新ハンドラー
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // サムネイル変更処理
  const handleThumbnailChange = (file: File) => {
    setFormData(prev => ({
      ...prev,
      thumbnailFile: file,
      thumbnailUrl: URL.createObjectURL(file)
    }));
  };

  // サムネイル削除処理
  const handleThumbnailClear = () => {
    setFormData(prev => ({
      ...prev,
      thumbnailFile: null,
      thumbnailUrl: null
    }));
  };

  // サムネイルアップロード処理
  const uploadThumbnail = async (file: File): Promise<string | null> => {
    try {
      // セッションから認証トークンを取得
      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const formData = new FormData();
      formData.append('thumbnailImage', file);

      const response = await fetch('/api/media/thumbnail-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`サムネイルアップロードに失敗しました: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.publicUrl;
    } catch (error) {
      console.error('サムネイルアップロードエラー:', error);
      throw error;
    }
  };

  // プロンプト更新処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.promptContent.trim()) {
      toast({
        title: "入力エラー",
        description: "タイトルとプロンプト内容は必須です",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // サムネイルがアップロードされている場合の処理
      let thumbnailUrl = formData.thumbnailUrl;
      if (formData.thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(formData.thumbnailFile);
      }

      const { error } = await supabase
        .from('prompts')
        .update({
          title: formData.title,
          description: formData.description,
          prompt_title: formData.promptTitle,
          prompt_content: formData.promptContent,
          price: formData.isFree ? 0 : formData.price,
          is_free: formData.isFree,
          ai_model: formData.aiModel || null,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptData.id);

      if (error) {
        toast({
          title: "更新エラー",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "更新成功",
        description: "プロンプトを更新しました",
      });

      router.push('/prompts/' + promptData.id);
    } catch (error: any) {
      toast({
        title: "更新エラー",
        description: error.message || "不明なエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング状態（認証確認中または権限チェック中）
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {authLoading ? '認証状態を確認中...' : '編集権限を確認中...'}
          </p>
        </div>
      </div>
    );
  }

  // 認証エラー状態
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセスエラー</h1>
          <p className="text-gray-600 mb-6">{authError}</p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push(`/prompts/${promptData.id}`)}
              className="w-full"
            >
              プロンプト詳細に戻る
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 編集権限がない場合（通常はauthErrorで処理されるが、念のため）
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">アクセス権限を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8 mt-10">
        {/* ヘッダー */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/prompts/' + promptData.id)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            プロンプト詳細に戻る
          </button>
          <h1 className="text-3xl font-bold">プロンプト編集</h1>
          <p className="text-gray-600 mt-2">「{promptData.title}」を編集しています</p>
        </div>

        {/* 編集フォーム */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* サムネイル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                サムネイル
              </label>
              <ThumbnailUploader
                thumbnailPreview={formData.thumbnailUrl}
                onThumbnailChange={handleThumbnailChange}
                onThumbnailClear={handleThumbnailClear}
                mediaType={formData.thumbnailUrl?.includes('.mp4') || formData.thumbnailFile?.type.startsWith('video/') ? 'video' : 'image'}
              />
            </div>

            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="プロンプトのタイトルを入力"
                required
                className="w-full"
              />
            </div>

            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="プロンプトの説明を入力（任意）"
                rows={3}
                className="w-full"
              />
            </div>

            {/* プロンプトタイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプトタイトル
              </label>
              <Input
                value={formData.promptTitle}
                onChange={(e) => handleInputChange('promptTitle', e.target.value)}
                placeholder="プロンプトのタイトル"
                className="w-full"
              />
            </div>

            {/* プロンプト内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロンプト内容 *
              </label>
              <Textarea
                value={formData.promptContent}
                onChange={(e) => handleInputChange('promptContent', e.target.value)}
                placeholder="プロンプトの内容を入力"
                rows={10}
                required
                className="w-full"
              />
            </div>

            {/* AIモデル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AIモデル
              </label>
              <Input
                value={formData.aiModel}
                onChange={(e) => handleInputChange('aiModel', e.target.value)}
                placeholder="chat-gpt"
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                <p>• 推奨: claude-4-20250120 (最新・高性能)</p>
                <p>• 高速: claude-3-5-haiku-20241022 (経済的)</p>
                <p>• その他: gpt-4o, gemini-1.5-pro など</p>
              </div>
            </div>

            {/* 価格設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                価格設定
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="free"
                    name="pricing"
                    checked={formData.isFree}
                    onChange={() => handleInputChange('isFree', true)}
                    className="mr-2"
                  />
                  <label htmlFor="free">無料</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="paid"
                    name="pricing"
                    checked={!formData.isFree}
                    onChange={() => handleInputChange('isFree', false)}
                    className="mr-2"
                  />
                  <label htmlFor="paid">有料</label>
                  {!formData.isFree && (
                    <div className="ml-4 flex items-center">
                      <span className="mr-2">¥</span>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/prompts/' + promptData.id)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    変更を保存
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPromptPage;

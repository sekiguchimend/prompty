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
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

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
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    title: promptData.title || '',
    description: promptData.description || '',
    promptTitle: promptData.prompt_title || '',
    promptContent: promptData.prompt_content || '',
    price: promptData.price || 0,
    isFree: promptData.is_free,
  });

  // 認証チェック
  useEffect(() => {
    if (!user) {
      toast({
        title: "認証エラー",
        description: "ログインが必要です",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }
    
    if (user.id !== promptData.author_id) {
      toast({
        title: "権限エラー",
        description: "このプロンプトを編集する権限がありません",
        variant: "destructive",
      });
      router.push('/prompts/' + promptData.id);
      return;
    }
  }, [user, promptData.author_id, promptData.id, router, toast]);

  // フォーム更新ハンドラー
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

      const { error } = await supabase
        .from('prompts')
        .update({
          title: formData.title,
          description: formData.description,
          prompt_title: formData.promptTitle,
          prompt_content: formData.promptContent,
          price: formData.isFree ? 0 : formData.price,
          is_free: formData.isFree,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8 mt-10">
        {/* ヘッダー */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/prompts/' + promptData.id)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            プロンプト詳細に戻る
          </button>
          <h1 className="text-3xl font-bold">プロンプト編集</h1>
          <p className="text-gray-600 mt-2">「{promptData.title}」を編集しています</p>
        </div>

        {/* 編集フォーム */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              />
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
            <div className="flex justify-end pt-6 border-t">
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

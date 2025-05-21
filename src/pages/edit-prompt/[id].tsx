import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../lib/auth-context';

// プロンプト編集用のスキーマ
const promptEditSchema = z.object({
  title: z.string().min(1, "タイトルは必須項目です"),
  description: z.string(),
  promptTitle: z.string().min(1, "プロンプトタイトルは必須項目です"),
  promptContent: z.string().min(5, "プロンプト内容は最低5文字以上入力してください"),
});

type PromptEditFormValues = z.infer<typeof promptEditSchema>;

// サーバーサイドでプロンプトデータを取得
export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  // IDの取得
  const id = params?.id as string;
  
  if (!id) {
    return {
      notFound: true,
    };
  }

  try {
    // Supabaseからプロンプトデータを取得
    const { data: promptData, error } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        description,
        prompt_title,
        prompt_content,
        author_id,
        thumbnail_url,
        price,
        is_free,
        published
      `)
      .eq('id', id)
      .single();
      
    if (error || !promptData) {
      console.error("プロンプト取得エラー:", error);
      return {
        notFound: true,
      };
    }

    // 認証セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // ユーザーが作者と一致するか確認
    if (!user || user.id !== promptData.author_id) {
      return {
        redirect: {
          destination: '/prompts/' + id,
          permanent: false,
        },
      };
    }

    return {
      props: {
        promptData
      }
    };
  } catch (e) {
    console.error("エラー:", e);
    return {
      notFound: true,
    };
  }
};

interface EditPromptPageProps {
  promptData: {
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
  };
}

const EditPromptPage: React.FC<EditPromptPageProps> = ({ promptData }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームの初期値設定
  const form = useForm<PromptEditFormValues>({
    resolver: zodResolver(promptEditSchema),
    defaultValues: {
      title: promptData.title || '',
      description: promptData.description || '',
      promptTitle: promptData.prompt_title || '',
      promptContent: promptData.prompt_content || '',
    },
  });

  // 認証チェック
  useEffect(() => {
    if (user && user.id !== promptData.author_id) {
      toast({
        title: "権限エラー",
        description: "このプロンプトを編集する権限がありません",
        variant: "destructive",
      });
      router.push('/prompts/' + promptData.id);
    }
  }, [user, promptData.author_id, promptData.id, router, toast]);

  // プロンプト更新処理
  const handleSubmit = async (values: PromptEditFormValues) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('prompts')
        .update({
          title: values.title,
          description: values.description,
          prompt_title: values.promptTitle,
          prompt_content: values.promptContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptData.id);

      if (error) {
        toast({
          title: "更新エラー",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "更新成功",
        description: "プロンプトを更新しました",
      });

      // 詳細ページへリダイレクト
      router.push('/prompts/' + promptData.id);
    } catch (error: any) {
      toast({
        title: "更新エラー",
        description: error.message || "不明なエラーが発生しました",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-white pt-16 md:pt-10">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link 
              href={`/prompts/${promptData.id}`} 
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              戻る
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold mb-6">プロンプトを編集</h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* プロジェクトタイトル */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">プロジェクトタイトル</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: AIを活用した文章校正システム"
                          className="border-gray-300"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* プロジェクト説明 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">プロジェクト説明（オプション）</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="プロジェクトの概要や目的を記入してください"
                          className="min-h-[100px] border-gray-300"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* プロンプトタイトル */}
                <FormField
                  control={form.control}
                  name="promptTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">プロンプトタイトル</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: 文章校正プロンプト"
                          className="border-gray-300"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* プロンプト内容 */}
                <FormField
                  control={form.control}
                  name="promptContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">プロンプト内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="AIに送信したプロンプト全文をそのまま貼り付けてください"
                          className="min-h-[300px] border-gray-300"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
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
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditPromptPage;

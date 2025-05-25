import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Footer from '../../components/footer';
import { Button } from '../../components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronLeft, Save, Loader2, ArrowLeft, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/ui/use-toast';
import { useAuth } from '../../lib/auth-context';

// 編集フォーム用のインポート
import {
  PostModeSelector,
  StepBasedForm,
  StandardForm,
  type ProjectFormValues,
  type PromptFormValues,
  type Prompt,
  ProjectSettingsForm,
  PromptForm,
  AI_MODELS
} from '../../components/create-post';

// カテゴリの型定義
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  prompt_title: string;
  prompt_content: string;
  yaml_content: string;
  file_content: string;
}

// プロンプト編集用のスキーマ
const promptEditSchema = z.object({
  title: z.string().min(1, "タイトルは必須項目です"),
  description: z.string().optional(),
  promptTitle: z.string().min(1, "プロンプトタイトルは必須項目です"),
  promptContent: z.string().min(5, "プロンプト内容は最低5文字以上入力してください"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  pricingType: z.enum(["free", "paid"]),
  price: z.number().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  thumbnailUrl: z.string().optional(),
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
    // Supabaseからプロンプトデータとカテゴリを並列取得
    const [promptResult, categoriesResult] = await Promise.all([
      supabase
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
          published,
          ai_model,
          category_id,
          project_url,
          created_at,
          updated_at
      `)
      .eq('id', id)
        .single(),
      
      supabase
        .from('categories')
        .select('*')
        .order('name')
    ]);
      
    const { data: promptData, error: promptError } = promptResult;
    const { data: categoriesData, error: categoriesError } = categoriesResult;
      
    if (promptError || !promptData) {
      console.error("プロンプト取得エラー:", promptError);
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
        promptData,
        categories: categoriesData || []
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
    ai_model: string | null;
    category_id: string | null;
    project_url: string | null;
    created_at: string;
    updated_at: string | null;
  };
  categories: Category[];
}

const EditPromptPage: React.FC<EditPromptPageProps> = ({ promptData, categories }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 編集モード状態
  type EditMode = 'selection' | 'standard' | 'step';
  const [editMode, setEditMode] = useState<EditMode>('selection');
  
  // ステップベース編集用の状態
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const TOTAL_STEPS = 8;
  
  // プロジェクト設定の状態
  const [projectSettings, setProjectSettings] = useState<ProjectFormValues>({
    projectTitle: promptData.title || '',
    aiModel: promptData.ai_model || 'claude-3-5-sonnet',
    customAiModel: '',
    pricingType: promptData.is_free ? 'free' : 'paid',
    price: promptData.price || 0,
    projectDescription: promptData.description || '',
    thumbnail: promptData.thumbnail_url || '',
    projectUrl: promptData.project_url || '',
    categoryId: promptData.category_id,
  });
  
  // プロンプト履歴の状態
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: 1,
      prompt_title: promptData.prompt_title || '',
      prompt_content: promptData.prompt_content || '',
      yaml_content: '',
      file_content: '',
      createdAt: new Date(promptData.created_at),
    }
  ]);
  const [promptNumber, setPromptNumber] = useState(2);
  
  // サムネイル画像の状態
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // フォームの初期値設定
  const form = useForm<PromptEditFormValues>({
    resolver: zodResolver(promptEditSchema),
    defaultValues: {
      title: promptData.title || '',
      description: promptData.description || '',
      promptTitle: promptData.prompt_title || '',
      promptContent: promptData.prompt_content || '',
      aiModel: promptData.ai_model || 'claude-3-5-sonnet',
      pricingType: promptData.is_free ? 'free' : 'paid',
      price: promptData.price || 0,
      categoryId: promptData.category_id,
      thumbnailUrl: promptData.thumbnail_url || '',
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

  // プロジェクト設定の保存ハンドラー
  const handleProjectSave = (settings: ProjectFormValues) => {
    setProjectSettings(settings);
    toast({
      title: "設定保存",
      description: "プロジェクト設定が保存されました",
    });
  };

  // プロンプト送信ハンドラー
  const handlePromptSubmit = (promptData: PromptFormValues) => {
    const newPrompt: Prompt = {
      id: promptNumber,
      prompt_title: `プロンプト ${promptNumber}`,
      prompt_content: promptData.fullPrompt,
      yaml_content: promptData.yaml_content || '',
      file_content: promptData.file_content || '',
      createdAt: new Date(),
    };
    
    setPrompts(prev => [...prev, newPrompt]);
    setPromptNumber(prev => prev + 1);
    
    toast({
      title: "プロンプト追加",
      description: "新しいプロンプトが追加されました",
    });
  };

  // プロンプト編集ハンドラー
  const handleEditPrompt = (updatedPrompt: Prompt) => {
    setPrompts(prev => prev.map(p => 
      p.id === updatedPrompt.id 
        ? updatedPrompt
        : p
    ));
    
    toast({
      title: "プロンプト更新",
      description: "プロンプトが更新されました",
    });
  };

  // ステップ完了マーク
  const markStepAsCompleted = (step: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(step);
      return newSet;
    });
  };

  // ステップナビゲーション
  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // AIモデルのラベル取得
  const getModelLabel = (modelValue: string) => {
    if (modelValue === "custom") {
      return projectSettings.customAiModel || "カスタムモデル";
    }
    
    const model = AI_MODELS.find(m => m.value === modelValue);
    return model ? model.label : modelValue;
  };

  // カテゴリ一覧の再取得
  const fetchCategories = async () => {
    // 実装は必要に応じて追加
  };

  // プロンプト更新処理
  const handleSubmit = async (values: PromptEditFormValues) => {
    try {
      setIsSubmitting(true);

      // 主要プロンプトデータの更新
      const mainPrompt = prompts[0]; // 最初のプロンプトをメインとする

      const { error } = await supabase
        .from('prompts')
        .update({
          title: projectSettings.projectTitle,
          description: projectSettings.projectDescription,
          prompt_title: mainPrompt.prompt_title,
          prompt_content: mainPrompt.prompt_content,
          ai_model: projectSettings.aiModel,
          price: projectSettings.pricingType === 'free' ? 0 : projectSettings.price,
          is_free: projectSettings.pricingType === 'free',
          category_id: projectSettings.categoryId,
          thumbnail_url: projectSettings.thumbnail,
          project_url: projectSettings.projectUrl,
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

  // 最終的な投稿処理
  const submitProject = async () => {
    await handleSubmit(form.getValues());
  };

  // 編集モード選択ハンドラー
  const handleSelectEditMode = (mode: 'standard' | 'step') => {
    console.log(`選択された編集モード: ${mode}`);
    setEditMode(mode);
  };

  // 戻るボタンのハンドラー
  const handleBackButtonClick = () => {
    if (editMode === 'selection') {
      router.push('/prompts/' + promptData.id);
    } else {
      setEditMode('selection');
    }
  };

  // 戻るボタンのラベル
  const getBackButtonLabel = () => {
    return editMode === 'selection' ? 'プロンプト詳細に戻る' : '編集モード選択に戻る';
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 mt-10">
        {/* 編集モード選択か、編集フォームかを表示 */}
        {(() => {
          switch (editMode) {
            case 'selection':
              return (
                <>
          <div className="mb-6">
                    <button 
                      onClick={handleBackButtonClick}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
                      {getBackButtonLabel()}
                    </button>
                  </div>

                  <div className="w-full max-w-4xl mx-auto mb-12">
                    <div className="text-center mb-8">
                      <Edit3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                      <h1 className="text-3xl font-bold mb-2">編集方法を選択</h1>
                      <p className="text-gray-600">プロンプト「{promptData.title}」の編集方法を選択してください</p>
          </div>

                    {/* 編集モード選択UI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* ステップ編集ボタン */}
                      <div 
                        onClick={() => handleSelectEditMode('step')}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex flex-col items-start">
                          <h3 className="text-xl font-bold mb-2">ステップ編集</h3>
                          <p className="text-gray-600 mb-4">一項目ずつガイド付きで編集できます。詳細に設定したい方におすすめです。</p>
                          <div className="mt-auto flex items-center text-indigo-600 font-medium">
                            選択する <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                          </div>
                        </div>
                      </div>

                      {/* 通常編集ボタン */}
                      <div 
                        onClick={() => handleSelectEditMode('standard')}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex flex-col items-start">
                          <h3 className="text-xl font-bold mb-2">通常編集</h3>
                          <p className="text-gray-600 mb-4">一画面ですべての項目を編集できます。簡単に変更したい方向けです。</p>
                          <div className="mt-auto flex items-center text-indigo-600 font-medium">
                            選択する <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 現在のプロンプト情報プレビュー */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold mb-4">現在のプロンプト情報</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">タイトル</p>
                          <p className="font-medium">{promptData.title}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">AIモデル</p>
                          <p className="font-medium">{promptData.ai_model || '未設定'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">価格設定</p>
                          <p className="font-medium">{promptData.is_free ? '無料' : `¥${promptData.price}`}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">最終更新</p>
                          <p className="font-medium">{new Date(promptData.updated_at || promptData.created_at).toLocaleDateString('ja-JP')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            case 'standard':
            case 'step':
              return (
                <>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <button 
                      onClick={handleBackButtonClick}
                      className="text-gray-500 hover:text-black flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> 
                      {getBackButtonLabel()}
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">編集中:</span> {promptData.title}
                    </div>
                  </div>

                  {/* 編集フォーム - モードに応じて表示を切り替え */}
                  {editMode === 'standard' ? (
                    // 通常編集モード
                    <>
                      <div className="mb-8">
                        <ProjectSettingsForm
                          onSave={handleProjectSave}
                          defaultValues={projectSettings}
                          categories={categories}
                          isLoadingCategories={false}
                          onRefreshCategories={fetchCategories}
                        />
                      </div>
                      
                      <div className="mb-8">
                        <PromptForm
                          onSubmit={handlePromptSubmit}
                          initialPromptNumber={promptNumber}
                          aiModel={projectSettings.aiModel}
                          modelLabel={getModelLabel(projectSettings.aiModel)}
                        />
                      </div>
                      
                      {/* 更新ボタン */}
                      <div className="mt-8">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">変更を保存</h3>
                              <p className="text-sm text-gray-600 mt-1">すべての変更を保存してプロンプトを更新します</p>
                            </div>
                  <Button
                              onClick={submitProject}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isSubmitting}
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
          </div>
        </div>
                    </>
                  ) : (
                    // ステップ編集モード
                    <StepBasedForm
                      currentStep={currentStep}
                      totalSteps={TOTAL_STEPS}
                      completedSteps={completedSteps}
                      projectSettings={projectSettings}
                      setProjectSettings={setProjectSettings}
                      categories={categories}
                      isLoadingCategories={false}
                      onRefreshCategories={fetchCategories}
                      prompts={prompts}
                      handlePromptSubmit={handlePromptSubmit}
                      handleEditPrompt={handleEditPrompt}
                      promptNumber={promptNumber}
                      getModelLabel={getModelLabel}
                      markStepAsCompleted={markStepAsCompleted}
                      goToNextStep={goToNextStep}
                      goToPreviousStep={goToPreviousStep}
                      submitProject={submitProject}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </>
              );
            default:
              return null;
          }
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default EditPromptPage;

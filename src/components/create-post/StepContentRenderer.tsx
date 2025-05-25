import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Send, Type, Bot, DollarSign, FileText, Tag, Image, MessageSquare, CheckCircle2 } from 'lucide-react';
import type { Prompt, ProjectFormValues, PromptFormValues } from '.';
import ProjectSettingsForm from './ProjectSettingsForm';
import PromptForm from './PromptForm';
import PromptHistory from './PromptHistory';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ThumbnailUploader from './ThumbnailUploader';
import CategorySelector from './CategorySelector';
import ModelSelector from './ModelSelector';
import PricingSelector from './PricingSelector';
import { FormProvider } from "react-hook-form";

interface StepContentRendererProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  projectSettings: ProjectFormValues;
  setProjectSettings: React.Dispatch<React.SetStateAction<ProjectFormValues>>;
  categories: any[];
  isLoadingCategories: boolean;
  onRefreshCategories: () => void;
  prompts: Prompt[];
  handlePromptSubmit: (data: any) => void;
  handleEditPrompt: (prompt: Prompt) => void;
  promptNumber: number;
  getModelLabel: (modelValue: string) => string;
  markStepAsCompleted: (step: number) => void;
  goToNextStep: () => void;
  submitProject: () => void;
  isSubmitting: boolean;
}

// フォームスキーマ定義
const projectSchema = z.object({
  projectTitle: z.string().min(1, "プロジェクトタイトルを入力してください"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  customAiModel: z.string().optional(),
  pricingType: z.enum(["free", "paid"]),
  price: z.coerce.number().min(0).optional(),
  projectDescription: z.string().min(10, "プロジェクト説明は10文字以上入力してください").optional(),
  projectUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  thumbnail: z.string().optional(),
  categoryId: z.string().nullable().optional(),
});

const StepContentRenderer: React.FC<StepContentRendererProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  projectSettings,
  setProjectSettings,
  categories,
  isLoadingCategories,
  onRefreshCategories,
  prompts,
  handlePromptSubmit,
  handleEditPrompt,
  promptNumber,
  getModelLabel,
  markStepAsCompleted,
  goToNextStep,
  submitProject,
  isSubmitting
}) => {
  // フォームの初期化
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: projectSettings,
  });

  // プロジェクト設定の一項目保存
  const saveProjectSetting = (data: Partial<ProjectFormValues>) => {
    const updatedSettings = { ...projectSettings, ...data };
    setProjectSettings(updatedSettings);
    markStepAsCompleted(currentStep);
    goToNextStep();
  };

  // プロンプト送信時のハンドラー
  const handleStepPromptSubmit = (data: PromptFormValues) => {
    handlePromptSubmit(data);
    markStepAsCompleted(currentStep);
    goToNextStep();
  };
  
  // サムネイル変更ハンドラー
  const handleThumbnailChange = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result as string;
      saveProjectSetting({ thumbnail: result });
    };
    
    reader.readAsDataURL(file);
  };
  
  // サムネイルクリアハンドラー
  const handleThumbnailClear = () => {
    saveProjectSetting({ thumbnail: "" });
  };

  // 現在のステップに応じてコンテンツを表示
  const renderStepContent = () => {
    switch(currentStep) {
      // プロジェクトタイトル入力
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">プロジェクトタイトル</h3>
                  <p className="text-sm text-gray-600">投稿するプロンプトプロジェクトのタイトルを入力してください</p>
                </div>
              </div>
              
            <form onSubmit={(e) => {
              e.preventDefault();
              const title = form.getValues().projectTitle;
              if (title && title.length > 0) {
                saveProjectSetting({ projectTitle: title });
              }
            }}>
              <FormProvider {...form}>
                <FormField
                  control={form.control}
                  name="projectTitle"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                        <FormLabel className="text-base font-medium text-gray-900">
                          タイトル <span className="text-red-500">*</span>
                        </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                            placeholder="例: ChatGPTを活用した営業メール作成ツール"
                            className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500 mt-1">
                          分かりやすく魅力的なタイトルを付けてください
                        </p>
                    </FormItem>
                  )}
                />
              </FormProvider>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                    disabled={!form.watch("projectTitle")}
                >
                  次へ進む
                </Button>
              </div>
            </form>
            </div>
          </div>
        );
      
      // AIモデル選択
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AIモデル選択</h3>
                  <p className="text-sm text-gray-600">プロンプトで使用するAIモデルを選択してください</p>
                </div>
              </div>
              
            <div className="mb-6">
              <FormProvider {...form}>
                  <FormLabel className="text-base font-medium text-gray-900 mb-3 block">
                    AIモデル <span className="text-red-500">*</span>
                  </FormLabel>
                <ModelSelector
                  control={form.control}
                  isCustomModel={projectSettings.aiModel === "custom"}
                  onModelChange={(value: string) => {
                    saveProjectSetting({ aiModel: value });
                  }}
                />
              </FormProvider>
                <p className="text-sm text-gray-500 mt-3">
                  プロンプトが最適化されているAIモデルを選択してください
                </p>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                    disabled={!projectSettings.aiModel}
                >
                  次へ進む
                </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // 価格設定
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">価格設定</h3>
                  <p className="text-sm text-gray-600">プロンプトの公開形式を選択してください</p>
                </div>
              </div>
              
            <div className="mb-6">
              <FormProvider {...form}>
                  <FormLabel className="text-base font-medium text-gray-900 mb-3 block">
                    公開形式 <span className="text-red-500">*</span>
                  </FormLabel>
                <PricingSelector
                  control={form.control}
                  pricingType={projectSettings.pricingType}
                  onPricingTypeChange={(value: string) => {
                    const pricingType = value as "free" | "paid";
                    const price = pricingType === "free" ? 0 : projectSettings.price;
                    saveProjectSetting({ pricingType, price });
                  }}
                />
              </FormProvider>
                <p className="text-sm text-gray-500 mt-3">
                  無料公開または有料販売を選択できます
                </p>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                >
                  次へ進む
                </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // プロジェクト説明
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">プロジェクト説明</h3>
                  <p className="text-sm text-gray-600">プロンプトプロジェクトの詳細な説明を入力してください</p>
                </div>
              </div>
              
            <form onSubmit={(e) => {
              e.preventDefault();
              const description = form.getValues().projectDescription;
              if (description && description.length >= 10) {
                saveProjectSetting({ projectDescription: description });
              } else {
                form.setError("projectDescription", {
                  type: "manual",
                  message: "プロジェクト説明は10文字以上入力してください"
                });
              }
            }}>
              <FormProvider {...form}>
                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                        <FormLabel className="text-base font-medium text-gray-900">
                          プロジェクト説明 <span className="text-red-500">*</span> 
                          <span className="text-sm font-normal text-gray-500">(10文字以上)</span>
                        </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          defaultValue={projectSettings.projectDescription}
                            placeholder="プロンプトの用途、特徴、効果などを詳しく説明してください&#10;&#10;例：&#10;・どのような課題を解決するプロンプトか&#10;・どのような場面で使用するか&#10;・期待できる効果や結果"
                            className="min-h-[150px] border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                        />
                      </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500 mt-1">
                          ユーザーがプロンプトの価値を理解できるよう詳しく説明してください
                        </p>
                    </FormItem>
                  )}
                />
              </FormProvider>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                    disabled={!form.watch("projectDescription") || (form.watch("projectDescription")?.length || 0) < 10}
                >
                  次へ進む
                </Button>
              </div>
            </form>
            </div>
          </div>
        );
      
      // カテゴリ選択
      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">カテゴリ選択</h3>
                  <p className="text-sm text-gray-600">プロンプトに最適なカテゴリを選択してください</p>
                </div>
              </div>
              
            <div className="mb-6">
              <FormProvider {...form}>
                  <FormLabel className="text-base font-medium text-gray-900 mb-3 block">
                    カテゴリ <span className="text-gray-500">(任意)</span>
                  </FormLabel>
                <CategorySelector
                  control={form.control}
                  categories={categories}
                  isLoading={isLoadingCategories}
                  onRefresh={onRefreshCategories}
                />
              </FormProvider>
                <p className="text-sm text-gray-500 mt-3">
                  適切なカテゴリを選択することで、ユーザーが見つけやすくなります
                </p>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    const categoryId = form.getValues().categoryId;
                    saveProjectSetting({ categoryId });
                  }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                >
                  次へ進む
                </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // サムネイル設定
      case 6:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                  <Image className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">サムネイル画像</h3>
                  <p className="text-sm text-gray-600">プロンプトプロジェクトの印象的なサムネイル画像を設定してください</p>
                </div>
              </div>
              
            <div className="mb-6">
              <FormProvider {...form}>
                  <FormLabel className="text-base font-medium text-gray-900 mb-3 block">
                    サムネイル画像 <span className="text-gray-500">(任意)</span>
                  </FormLabel>
                <ThumbnailUploader
                  thumbnailPreview={projectSettings.thumbnail || null}
                  onThumbnailChange={handleThumbnailChange}
                  onThumbnailClear={handleThumbnailClear}
                />
              </FormProvider>
                <p className="text-sm text-gray-500 mt-3">
                  魅力的なサムネイル画像でユーザーの関心を引きましょう（推奨サイズ：16:9）
                </p>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                >
                  次へ進む
                </Button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // プロンプト入力
      case 7:
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">プロンプト入力</h3>
                  <p className="text-sm text-gray-600">実際に使用するプロンプトを入力してください</p>
                </div>
              </div>
              
            <PromptForm
              onSubmit={handleStepPromptSubmit}
              initialPromptNumber={promptNumber}
              aiModel={projectSettings.aiModel}
              modelLabel={getModelLabel(projectSettings.aiModel)}
            />
            </div>
          </div>
        );
      
      // 確認と投稿
      case 8:
  return (
          <div className="space-y-6">
            {/* 最終確認ヘッダー */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Send className="h-5 w-5" />
                  </div>
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900">確認と投稿</h3>
                  <p className="text-sm text-gray-600">入力内容を確認して投稿してください</p>
                </div>
              </div>
            </div>

            {/* プロジェクト情報確認 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                プロジェクト情報
              </h4>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  <div className="border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-600">タイトル</dt>
                    <dd className="text-gray-900 font-medium">{projectSettings.projectTitle}</dd>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-600">AIモデル</dt>
                    <dd className="text-gray-900">{getModelLabel(projectSettings.aiModel)}</dd>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-600">価格設定</dt>
                    <dd className="text-gray-900">
                      {projectSettings.pricingType === 'free'
                        ? '無料公開'
                        : `有料販売 (¥${projectSettings.price})`}
                    </dd>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-600">カテゴリ</dt>
                    <dd className="text-gray-900">
                      {projectSettings.categoryId 
                        ? categories.find(c => c.id === projectSettings.categoryId)?.name || '選択済み'
                        : '未選択'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2 border-b border-gray-200 pb-2">
                    <dt className="text-sm font-medium text-gray-600">説明</dt>
                    <dd className="text-gray-900 whitespace-pre-line">{projectSettings.projectDescription}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600">サムネイル</dt>
                    <dd className="text-gray-900">
                      {projectSettings.thumbnail ? (
                        <div className="mt-2">
                          <img 
                            src={projectSettings.thumbnail} 
                            alt="サムネイル" 
                            className="w-32 h-18 object-cover rounded-md border border-gray-200"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">未設定</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* プロンプト確認 */}
            {prompts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  登録済みプロンプト ({prompts.length}件)
                </h4>
                <PromptHistory
                  prompts={prompts}
                  onEditPrompt={handleEditPrompt}
                />
              </div>
            )}
            
            {/* 投稿ボタン */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-1">
                    すべての情報を確認し、問題がなければ投稿してください。
                  </p>
                  <p className="text-xs text-gray-500">
                    投稿後は一部の情報を変更できません。
                  </p>
                </div>
                
              <Button
                onClick={submitProject}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-semibold"
                disabled={isSubmitting || prompts.length === 0}
                  size="lg"
              >
                {isSubmitting ? (
                  <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    投稿処理中...
                  </>
                ) : (
                  <>
                      <Send className="h-5 w-5 mr-2" />
                      プロジェクトを投稿
                  </>
                )}
              </Button>
              </div>
              
              {/* エラー表示 */}
              {prompts.length === 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">注意:</span> 最低1つのプロンプトを追加してください。
                  </p>
                </div>
              )}
      </div>
    </div>
  );
      
      default:
        return <div>不明なステップです</div>;
    }
  };

  return renderStepContent();
};

export default StepContentRenderer; 
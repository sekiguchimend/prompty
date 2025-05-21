import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Send } from 'lucide-react';
import type { Prompt, ProjectFormValues, PromptFormValues } from '.';
import ProjectSettingsForm from './ProjectSettingsForm';
import PromptForm from './PromptForm';
import PromptHistory from './PromptHistory';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 1: プロジェクトタイトル</h2>
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
                      <FormLabel className="text-base font-medium">プロジェクトタイトル</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          defaultValue={projectSettings.projectTitle}
                          placeholder="プロジェクトタイトルを入力"
                          className="border-gray-300 focus:border-black focus:ring-black"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </FormProvider>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </form>
          </div>
        );
      
      // AIモデル選択
      case 2:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 2: AIモデル選択</h2>
            <div className="mb-6">
              <FormProvider {...form}>
                <FormLabel className="text-base font-medium">使用するAIモデル</FormLabel>
                <ModelSelector
                  control={form.control}
                  isCustomModel={projectSettings.aiModel === "custom"}
                  onModelChange={(value: string) => {
                    saveProjectSetting({ aiModel: value });
                  }}
                />
              </FormProvider>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </div>
          </div>
        );
      
      // 価格設定
      case 3:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 3: 価格設定</h2>
            <div className="mb-6">
              <FormProvider {...form}>
                <FormLabel className="text-base font-medium">価格タイプ</FormLabel>
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
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </div>
          </div>
        );
      
      // プロジェクト説明
      case 4:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 4: プロジェクト説明</h2>
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
                      <FormLabel className="text-base font-medium">プロジェクト説明 (10文字以上)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          defaultValue={projectSettings.projectDescription}
                          placeholder="プロジェクトについての説明を入力してください（10文字以上）"
                          className="min-h-[150px] border-gray-300 focus:border-black focus:ring-black"
                        />
                      </FormControl>
                      {form.formState.errors.projectDescription && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.projectDescription.message}</p>
                      )}
                    </FormItem>
                  )}
                />
              </FormProvider>
              <div className="flex justify-end">
                <Button 
                  type="submit"
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </form>
          </div>
        );
      
      // カテゴリ選択
      case 5:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 5: カテゴリ選択</h2>
            <div className="mb-6">
              <FormProvider {...form}>
                <FormLabel className="text-base font-medium">カテゴリ</FormLabel>
                <CategorySelector
                  control={form.control}
                  categories={categories}
                  isLoading={isLoadingCategories}
                  onRefresh={onRefreshCategories}
                />
              </FormProvider>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    const categoryId = form.getValues().categoryId;
                    saveProjectSetting({ categoryId });
                  }}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </div>
          </div>
        );
      
      // サムネイル設定
      case 6:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 6: サムネイル画像</h2>
            <div className="mb-6">
              <FormProvider {...form}>
                <FormLabel className="text-base font-medium">サムネイル画像 (任意)</FormLabel>
                <ThumbnailUploader
                  thumbnailPreview={projectSettings.thumbnail || null}
                  onThumbnailChange={handleThumbnailChange}
                  onThumbnailClear={handleThumbnailClear}
                />
              </FormProvider>
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    markStepAsCompleted(currentStep);
                    goToNextStep();
                  }}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  次へ進む
                </Button>
              </div>
            </div>
          </div>
        );
      
      // プロンプト入力
      case 7:
        return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 7: プロンプト入力</h2>
            <PromptForm
              onSubmit={handleStepPromptSubmit}
              initialPromptNumber={promptNumber}
              aiModel={projectSettings.aiModel}
              modelLabel={getModelLabel(projectSettings.aiModel)}
            />
          </div>
        );
      
      // 確認と投稿
      case 8:
  return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">ステップ 8: 確認と投稿</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">プロジェクト情報</h3>
              <div className="rounded-md bg-gray-50 p-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">タイトル</dt>
                    <dd className="text-black">{projectSettings.projectTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">AIモデル</dt>
                    <dd className="text-black">{getModelLabel(projectSettings.aiModel)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">説明</dt>
                    <dd className="text-black whitespace-pre-line">{projectSettings.projectDescription}</dd>
                  </div>
    <div>
                    <dt className="text-sm font-medium text-gray-500">価格設定</dt>
                    <dd className="text-black">
                      {projectSettings.pricingType === 'free'
                        ? '無料'
                        : `有料 (${projectSettings.price}円)`}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {prompts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">登録済みプロンプト</h3>
                <PromptHistory
                  prompts={prompts}
                  onEditPrompt={handleEditPrompt}
                />
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={submitProject}
                className="bg-black hover:bg-gray-800 text-white"
                disabled={isSubmitting || prompts.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    投稿処理中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    投稿する
                  </>
                )}
              </Button>
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
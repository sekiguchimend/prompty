import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Link as LinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ThumbnailUploader from './ThumbnailUploader';
import CategorySelector from './CategorySelector';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import PricingSelector from './PricingSelector';
import { useToast } from "../../components/ui/use-toast";

// フォームのスキーマ定義
const projectSchema = z.object({
  projectTitle: z.string().min(1, "プロジェクトタイトルを入力してください"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  customAiModel: z.string().optional(),
  pricingType: z.enum(["free", "paid"]),
  price: z.coerce.number().min(0).optional(),
  projectDescription: z.string().optional(),
  projectUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  thumbnail: z.string().optional(),
  categoryId: z.string().nullable().optional(),
});

// フォームの値の型
export type ProjectFormValues = z.infer<typeof projectSchema>;

// カテゴリの型定義（CategorySelectorから再エクスポート）
export { AI_MODELS };

// コンポーネントのprops
interface ProjectSettingsFormProps {
  onSave: (data: ProjectFormValues) => void;
  defaultValues?: Partial<ProjectFormValues>;
  categories?: { id: string; name: string; slug: string; description: string | null; icon: string | null; parent_id: string | null; }[];
  isLoadingCategories?: boolean;
  onRefreshCategories?: () => void;
}

const ProjectSettingsForm: React.FC<ProjectSettingsFormProps> = ({ 
  onSave,
  defaultValues = {
    projectTitle: "",
    aiModel: "claude-3-5-sonnet",
    customAiModel: "",
    pricingType: "free",
    price: 0,
    projectDescription: "",
    projectUrl: "",
    thumbnail: "",
    categoryId: null,
  },
  categories = [],
  isLoadingCategories = false,
  onRefreshCategories
}) => {
  const { toast } = useToast();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(defaultValues.thumbnail || null);
  const [isCustomModel, setIsCustomModel] = useState(defaultValues.aiModel === "custom");
  
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  // サムネイル画像の処理
  const handleThumbnailChange = (file: File) => {
    const reader = new FileReader();
    
    console.log('サムネイル画像を読み込み中...', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    reader.onload = (event) => {
      const result = event.target?.result as string;
      console.log('サムネイル読み込み完了:', result.substring(0, 50) + '...');
      console.log('サムネイルデータ長さ:', result.length);
      setThumbnailPreview(result);
      projectForm.setValue("thumbnail", result);
      
      // 設定が変更されたら自動的に親コンポーネントに通知
      autoSaveChanges({...projectForm.getValues(), thumbnail: result});
    };
    
    reader.onerror = (error) => {
      console.error('ファイル読み込みエラー:', error);
      toast({
        title: "エラー",
        description: "画像の読み込み中にエラーが発生しました",
        variant: "destructive",
      });
    };
    
    reader.readAsDataURL(file);
  };

  // サムネイル画像をクリア
  const clearThumbnail = () => {
    console.log('サムネイル画像をクリアします');
    setThumbnailPreview(null);
    projectForm.setValue("thumbnail", "");
    
    // クリア時も親コンポーネントに通知
    autoSaveChanges({...projectForm.getValues(), thumbnail: ""});
  };
  
  // 変更を自動保存する関数
  const autoSaveChanges = (data: ProjectFormValues) => {
    // カスタムAIモデルの処理
    if (data.aiModel === "custom" && data.customAiModel) {
      data.aiModel = data.customAiModel;
    }
    
    // 無料の場合は価格を0に設定
    if (data.pricingType === "free") {
      data.price = 0;
    }
    
    // 親コンポーネントに通知
    onSave(data);
  };

  // AIモデル変更時のハンドラー
  const handleAiModelChange = (value: string) => {
    projectForm.setValue("aiModel", value);
    setIsCustomModel(value === "custom");
    
    // モデル変更時も自動保存
    setTimeout(() => {
      autoSaveChanges(projectForm.getValues());
    }, 100);
  };

  // 料金タイプ変更時のハンドラー
  const handlePricingTypeChange = (value: string) => {
    projectForm.setValue("pricingType", value as "free" | "paid");
    
    // 料金タイプ変更時も自動保存
    setTimeout(() => {
      autoSaveChanges(projectForm.getValues());
    }, 100);
  };

  // カテゴリ一覧を再取得する関数
  const refreshCategories = () => {
    // 親コンポーネントのonRefreshCategoriesを呼び出す
    if (onRefreshCategories) {
      onRefreshCategories();
    } else {
      // フォールバックとしてトースト表示
      toast({
        title: "カテゴリ一覧更新",
        description: "カテゴリ一覧を更新します",
        variant: "default",
      });
    }
  };
  
  // フォームの値が変更されたら自動保存する
  useEffect(() => {
    const subscription = projectForm.watch((value) => {
      // 値が変更されるたびに自動保存（ただしdebounce処理をする）
      // 連続した変更の場合、最後の変更から500ms後に保存する
      const timeoutId = setTimeout(() => {
        if (Object.keys(value).length > 0) {
          autoSaveChanges(projectForm.getValues());
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => subscription.unsubscribe();
  }, [projectForm.watch]);

  return (
    <div className="bg-white rounded-lg">
      <Form {...projectForm}>
        <form>
          <div className="p-6">
            <div className="md:flex gap-8">
              {/* サムネイル画像アップロードエリア */}
              <ThumbnailUploader
                thumbnailPreview={thumbnailPreview}
                onThumbnailChange={handleThumbnailChange}
                onThumbnailClear={clearThumbnail}
              />
              
              {/* プロジェクト情報入力フォーム */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <FormField
                    control={projectForm.control}
                    name="projectTitle"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-gray-700">プロジェクトタイトル</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="プロジェクトタイトル"
                            className="border-gray-300"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="w-full md:w-48">
                    <ModelSelector
                      control={projectForm.control}
                      isCustomModel={isCustomModel}
                      onModelChange={handleAiModelChange}
                    />
                  </div>
                </div>
                
                {/* カテゴリ選択フィールド */}
                <CategorySelector
                  control={projectForm.control}
                  categories={categories}
                  isLoading={isLoadingCategories}
                  onRefresh={refreshCategories}
                />
                
                {/* 価格設定フィールド */}
                <PricingSelector
                  control={projectForm.control}
                  pricingType={projectForm.watch("pricingType")}
                  onPricingTypeChange={handlePricingTypeChange}
                />
                
                {/* URLフィールド */}
                <FormField
                  control={projectForm.control}
                  name="projectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">プロジェクトURL（任意）</FormLabel>
                      <FormControl>
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <div className="flex items-center justify-center border-r border-gray-300 h-10 w-10 bg-gray-50 text-gray-400">
                            <LinkIcon className="h-4 w-4" />
                          </div>
                          <Input
                            placeholder="https://example.com"
                            className="border-0 rounded-none focus:ring-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      {projectForm.formState.errors.projectUrl && (
                        <p className="text-xs text-red-600 mt-1">
                          {projectForm.formState.errors.projectUrl.message}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={projectForm.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">プロジェクト概要</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="このプロジェクトの目的や概要を入力してください"
                          className="h-20 border-gray-300 resize-none"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProjectSettingsForm; 
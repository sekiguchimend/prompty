import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Link as LinkIcon, Settings, Image, Palette, DollarSign, Brain, Tag, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ThumbnailUploader from './ThumbnailUploader';
import CategorySelector from './CategorySelector';
import ModelSelector, { AI_MODELS } from './ModelSelector';
import PricingSelector from './PricingSelector';
import { useToast } from "../../components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../lib/auth-context";

// フォームのスキーマ定義
const projectSchema = z.object({
  projectTitle: z.string().min(5, "プロジェクトタイトルは5文字以上である必要があります"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  customAiModel: z.string().optional(),
  pricingType: z.enum(["free", "paid"]),
  price: z.coerce.number().min(0).optional(),
  projectDescription: z.string().optional(),
  projectUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  thumbnail: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  previewLines: z.number().min(1).optional(),
});

// フォームの値の型
export type ProjectFormValues = z.infer<typeof projectSchema>;

// カテゴリの型定義（CategorySelectorから再エクスポート）
export { AI_MODELS };

// コンポーネントのprops
interface ProjectSettingsFormProps {
  onSave: (data: ProjectFormValues) => void;
  onThumbnailFileChange?: (file: File | null) => void;  // 追加
  defaultValues?: Partial<ProjectFormValues>;
  categories?: { id: string; name: string; slug: string; description: string | null; icon: string | null; parent_id: string | null; }[];
  isLoadingCategories?: boolean;
  onRefreshCategories?: () => void;
  onInsertPreviewMarker?: () => void;
}

const ProjectSettingsForm: React.FC<ProjectSettingsFormProps> = ({ 
  onSave,
  onThumbnailFileChange,  // 追加
  defaultValues = {
    projectTitle: "",

    aiModel: "",
    customAiModel: "",
    pricingType: "free",
    price: 0,
    projectDescription: "",
    projectUrl: "",
    thumbnail: "",
    categoryId: null,
    previewLines: 1,
  },
  categories = [],
  isLoadingCategories = false,
  onRefreshCategories,
  onInsertPreviewMarker
}) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(defaultValues.thumbnail || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  
  // アコーディオンの開閉状態
  const [openSections, setOpenSections] = useState({
    thumbnail: true,  // サムネイルは最初から開いている
    basic: true,      // 基本情報は最初から開いている
    advanced: false,  // 高度な設定は最初は閉じている
    ai: false,        // AIモデル設定は最初は閉じている
    pricing: false    // 料金設定は最初は閉じている
  });
  
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  // セクションの開閉を切り替える
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // サムネイル画像・動画の処理
  const handleThumbnailChange = async (file: File) => {
    try {
      // 先にファイルオブジェクトを親に渡す（即座に状態更新）
      if (onThumbnailFileChange) {
        onThumbnailFileChange(file);
      }
      
      // メディアタイプを判定
      const isVideo = file.type.startsWith('video/');
      const currentMediaType = isVideo ? 'video' : 'image';
      setMediaType(currentMediaType);
      
      // サムネイルアップロード開始

      // 動画の場合はプレビューを後で設定（data URLは使わない）
      if (!isVideo) {
        // 画像の場合のみローカルプレビューを表示
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setThumbnailPreview(result);
        };
        reader.readAsDataURL(file);
      } else {
        // 動画の場合は一時的にファイル名を表示
        setThumbnailPreview(`uploading_${file.name}`);
      }

      // Supabaseにアップロード
      const formData = new FormData();
      formData.append('thumbnailImage', file);

      // 認証トークンを取得
      let authHeader = '';
      
      if (session?.access_token) {
        authHeader = `Bearer ${session.access_token}`;
      } else {
        throw new Error('ログインしてください');
      }

      const response = await fetch('/api/media/thumbnail-upload', {
        method: 'POST',
        headers: authHeader ? { 'Authorization': authHeader } : {},
        body: formData
      });

      // API応答を処理

      if (!response.ok) {
        const responseText = await response.text();
        
        // HTMLレスポンスの場合は404ページが返されている
        if (responseText.includes('<!DOCTYPE html')) {
          throw new Error(`APIエンドポイントが見つかりません (${response.status})`);
        }
        
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `アップロードエラー: ${response.status}`);
        } catch (parseError) {
          throw new Error(`サーバーエラー: ${response.status} - ${responseText.slice(0, 100)}`);
        }
      }

      const result = await response.json();
      
      if (result.success && result.publicUrl) {
        
        // アップロード成功時、公開URLをプレビューとフォームに設定
        setThumbnailPreview(result.publicUrl);
        projectForm.setValue("thumbnail", result.publicUrl);
        
        // 設定が変更されたら自動的に親コンポーネントに通知
        autoSaveChanges({...projectForm.getValues(), thumbnail: result.publicUrl});
        
        toast({
          title: "アップロード完了",
          description: `${currentMediaType === 'video' ? '動画' : '画像'}のアップロードが完了しました`,
          variant: "default",
        });
      } else {
        throw new Error('アップロード結果が不正です');
      }
      
    } catch (error: any) {
      
      // エラー時はプレビューをクリア
      setThumbnailPreview(null);
      setMediaType(null);
      
      toast({
        title: "アップロードエラー",
        description: error.message || "サムネイルのアップロード中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  // サムネイル画像・動画をクリア
  const clearThumbnail = () => {
    setThumbnailPreview(null);
    setMediaType(null);
    projectForm.setValue("thumbnail", "");
    
    // ファイルオブジェクトもクリア
    if (onThumbnailFileChange) {
      onThumbnailFileChange(null);
    }
    
    // クリア時も親コンポーネントに通知
    autoSaveChanges({...projectForm.getValues(), thumbnail: ""});
  };
  
  // 変更を自動保存する関数
  const autoSaveChanges = (data: ProjectFormValues) => {
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
    let timeoutId: NodeJS.Timeout;
    
    const subscription = projectForm.watch((value) => {
      // 値が変更されるたびに自動保存（ただしdebounce処理をする）
      // 連続した変更の場合、最後の変更から500ms後に保存する
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (Object.keys(value).length > 0) {
          autoSaveChanges(projectForm.getValues());
        }
      }, 500);
    });
    
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-8">
        <Form {...projectForm}>
          <form className="space-y-8">
          {/* サムネイル画像セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <Collapsible open={openSections.thumbnail} onOpenChange={() => toggleSection('thumbnail')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-blue-300 transition-all duration-300 group ${
                  openSections.thumbnail ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300 group-hover:scale-110">
                        <Image className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">記事のメイン画像・動画</h4>
                        <p className="text-sm text-gray-600">読者の注目を集める魅力的な画像・動画を設定</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.thumbnail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                    <ThumbnailUploader
                      thumbnailPreview={thumbnailPreview}
                      onThumbnailChange={handleThumbnailChange}
                      onThumbnailClear={clearThumbnail}
                      mediaType={mediaType}
                    />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* 基本情報セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-green-300 transition-all duration-300 group ${
                  openSections.basic ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300 group-hover:scale-110">
                        <Palette className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300">基本情報</h4>
                        <p className="text-sm text-gray-600">タイトルと説明文</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.basic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* プロジェクトタイトル */}
                      <FormField
                        control={projectForm.control}
                        name="projectTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-900">プロジェクトタイトル *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="例：SEO記事作成支援プロンプト集"
                                className="h-11 focus:ring-2 focus:ring-green-500 transition-all duration-300"
                                {...field}
                              />
                            </FormControl>
                            {projectForm.formState.errors.projectTitle && (
                              <div className="text-red-600 text-sm animate-in slide-in-from-left-2 duration-300">
                                {projectForm.formState.errors.projectTitle.message}
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* カテゴリ */}
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">カテゴリ</FormLabel>
                        <CategorySelector
                          control={projectForm.control}
                          setValue={projectForm.setValue}
                          categories={categories}
                          isLoading={isLoadingCategories}
                          onRefresh={refreshCategories}
                        />
                      </FormItem>
              </div>
              
                    {/* プロジェクト説明 */}
                    <FormField
                      control={projectForm.control}
                      name="projectDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-900">プロジェクト説明</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="このプロジェクトの内容や使い方を説明してください"
                              className="min-h-[100px] resize-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* AIモデル設定セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <Collapsible open={openSections.ai} onOpenChange={() => toggleSection('ai')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-purple-300 transition-all duration-300 group ${
                  openSections.ai ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300 group-hover:scale-110">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">AIモデル設定</h4>
                        <p className="text-sm text-gray-600">使用するAIモデルを選択</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.ai ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <ModelSelector
                    control={projectForm.control}
                    onModelChange={handleAiModelChange}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
                </div>
                
          {/* 料金設定セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
            <Collapsible open={openSections.pricing} onOpenChange={() => toggleSection('pricing')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-yellow-300 transition-all duration-300 group ${
                  openSections.pricing ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-300 group-hover:scale-110">
                        <DollarSign className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors duration-300">料金設定</h4>
                        <p className="text-sm text-gray-600">無料または有料を選択</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.pricing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <PricingSelector
                    control={projectForm.control}
                    pricingType={projectForm.watch("pricingType")}
                    onPricingTypeChange={handlePricingTypeChange}
                    onInsertPreviewMarker={onInsertPreviewMarker}
                    previewLines={projectForm.watch("previewLines")}
                    onPreviewLinesChange={(lines) => {
                      projectForm.setValue("previewLines", lines);
                      autoSaveChanges(projectForm.getValues());
                    }}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
                </div>
                
          {/* 高度な設定セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection('advanced')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-gray-400 transition-all duration-300 group ${
                  openSections.advanced ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors duration-300 group-hover:scale-110">
                        <LinkIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">URL設定</h4>
                        <p className="text-sm text-gray-600">プロジェクトのURLを設定</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <FormField
                    control={projectForm.control}
                    name="projectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 flex items-center">
                          <LinkIcon className="h-4 w-4 mr-2 text-blue-600" />
                          プロジェクトのURL（任意）
                        </FormLabel>
                        <FormControl>
                            <Input
                              placeholder="https://example.com"
                            className="h-11 focus:ring-2 focus:ring-gray-500 transition-all duration-300"
                              {...field}
                            />
                        </FormControl>
                        {projectForm.formState.errors.projectUrl && (
                          <div className="text-red-600 text-sm animate-in slide-in-from-left-2 duration-300">
                            {projectForm.formState.errors.projectUrl.message}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* 自動保存の説明 */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-600">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">自動保存機能</span> - 設定内容は自動的に保存されます。
                  </p>
                </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
    </div>
  );
};

export default ProjectSettingsForm;
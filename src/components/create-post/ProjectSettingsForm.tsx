import React, { useRef, useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Image, Upload, XCircle, CheckCircle, Link as LinkIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
  { value: "custom", label: "カスタム（直接入力）" },
];

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
});

// フォームの値の型
export type ProjectFormValues = z.infer<typeof projectSchema>;

// コンポーネントのprops
interface ProjectSettingsFormProps {
  onSave: (data: ProjectFormValues) => void;
  defaultValues?: Partial<ProjectFormValues>;
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
  }
}) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(defaultValues.thumbnail || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCustomModel, setIsCustomModel] = useState(defaultValues.aiModel === "custom");
  
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues,
  });

  // サムネイル画像の処理
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      // ファイルサイズチェック
      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`サムネイル画像は${maxSizeMB}MB以下にしてください`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      console.log('サムネイル画像を読み込み中...', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        console.log('サムネイル読み込み完了:', result.substring(0, 50) + '...');
        setThumbnailPreview(result);
        projectForm.setValue("thumbnail", result);
      };
      
      reader.onerror = (error) => {
        console.error('ファイル読み込みエラー:', error);
        alert('画像の読み込み中にエラーが発生しました');
      };
      
      reader.readAsDataURL(file);
    }
  };

  // サムネイル画像をクリア
  const clearThumbnail = () => {
    setThumbnailPreview(null);
    projectForm.setValue("thumbnail", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // フォーム送信
  const onSubmit = (data: ProjectFormValues) => {
    // カスタムAIモデルの処理
    if (data.aiModel === "custom" && data.customAiModel) {
      data.aiModel = data.customAiModel;
    }
    
    // 無料の場合は価格を0に設定
    if (data.pricingType === "free") {
      data.price = 0;
    }
    
    onSave(data);
  };

  const handleAiModelChange = (value: string) => {
    projectForm.setValue("aiModel", value);
    setIsCustomModel(value === "custom");
  };

  const handlePricingTypeChange = (value: string) => {
    projectForm.setValue("pricingType", value as "free" | "paid");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <Form {...projectForm}>
        <form onSubmit={projectForm.handleSubmit(onSubmit)}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold mb-4">プロジェクト設定</h2>
            
            <div className="md:flex gap-8">
              {/* サムネイル画像アップロードエリア */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-32 h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <img 
                      src={thumbnailPreview} 
                      alt="サムネイルプレビュー" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                
                <div className="flex flex-col gap-2 lg:hidden">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-300 text-gray-700 text-xs py-1 h-7"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    画像選択
                  </Button>
                  
                  {thumbnailPreview && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearThumbnail}
                      className="border-gray-300 text-gray-700 px-2 py-1 h-7"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      削除
                    </Button>
                  )}
                </div>
              </div>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleThumbnailChange}
                className="hidden"
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
                  
                  <FormField
                    control={projectForm.control}
                    name="aiModel"
                    render={({ field }) => (
                      <FormItem className="w-full md:w-48">
                        <FormLabel className="text-gray-700">使用AIモデル</FormLabel>
                        <Select
                          onValueChange={handleAiModelChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="border-gray-300 bg-white">
                            <SelectValue placeholder="AIモデル選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {AI_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                {model.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* カスタムAIモデル入力フィールド */}
                {isCustomModel && (
                  <FormField
                    control={projectForm.control}
                    name="customAiModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">カスタムAIモデル名</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: GPT-4-1106-preview, gemini-1.5-pro"
                            className="border-gray-300"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* 有料/無料の選択 */}
                <FormField
                  control={projectForm.control}
                  name="pricingType"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-700">公開タイプ</FormLabel>
                      <FormControl>
                        <RadioGroup
                          defaultValue={field.value}
                          onValueChange={handlePricingTypeChange}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="free" id="free" />
                            <Label htmlFor="free" className="font-normal cursor-pointer">無料</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paid" id="paid" />
                            <Label htmlFor="paid" className="font-normal cursor-pointer">有料</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* 価格設定（有料の場合のみ表示） */}
                {projectForm.watch("pricingType") === "paid" && (
                  <FormField
                    control={projectForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">価格（円）</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="例: 300"
                            className="border-gray-300"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                
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
          
          <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg">
            <Button 
              type="submit"
              className="bg-black hover:bg-gray-800 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              設定を保存
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProjectSettingsForm; 
import React, { useRef, useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Image, Upload, XCircle, CheckCircle, Link as LinkIcon } from "lucide-react";

// 利用可能なAIモデルのリスト
export const AI_MODELS = [
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
];

// プロジェクトフォームスキーマ
export const projectFormSchema = z.object({
  projectTitle: z.string().min(1, "プロジェクトタイトルを入力してください"),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  projectDescription: z.string().optional(),
  thumbnail: z.string().optional(),
  projectUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")), // URL検証を追加
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectSettingsFormProps {
  onSave: (data: ProjectFormValues) => void;
  defaultValues?: ProjectFormValues;
}

const ProjectSettingsForm: React.FC<ProjectSettingsFormProps> = ({ 
  onSave, 
  defaultValues = {
    projectTitle: "新しいプロンプトプロジェクト",
    aiModel: "claude-3-5-sonnet",
    projectDescription: "",
    thumbnail: "",
    projectUrl: "",
  }
}) => {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    defaultValues.thumbnail ? defaultValues.thumbnail : null
  );
  const [isProjectSaved, setIsProjectSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // プロジェクト設定フォーム
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  const handleSubmit = (data: ProjectFormValues) => {
    onSave(data);
    setIsProjectSaved(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setThumbnailPreview(result);
        projectForm.setValue("thumbnail", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearThumbnail = () => {
    setThumbnailPreview(null);
    projectForm.setValue("thumbnail", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mb-8 border border-gray-200 rounded-lg bg-white p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-black">プロジェクト設定</h2>
        {isProjectSaved && (
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle className="h-4 w-4 mr-1" />
            保存済み
          </div>
        )}
      </div>
      
      <Form {...projectForm}>
        <form className="space-y-6" onSubmit={projectForm.handleSubmit(handleSubmit)}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* プロジェクトサムネイル */}
            <div className="w-full lg:w-36">
              <FormLabel className="text-gray-700 mb-2 block text-sm">プロジェクトサムネイル</FormLabel>
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
              
              <div className="hidden lg:flex gap-1 mt-2">
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gray-300 text-gray-700 text-xs py-1 h-7 w-full"
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
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* プロジェクト情報 */}
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
                        onValueChange={field.onChange}
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
          
          <div className="flex justify-end">
            <Button type="submit" variant="outline" className="border-gray-300 text-black text-sm">
              設定を保存
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProjectSettingsForm; 
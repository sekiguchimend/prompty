import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash } from "lucide-react";

// プロンプトフォームスキーマ
const promptFormSchema = z.object({
  prompt_title: z.string().min(1, "タイトルを入力してください"),
  prompt_content: z.string().min(1, "プロンプト内容を入力してください"),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  onSubmit: (data: PromptFormValues) => void;
  initialPromptNumber: number;
  aiModel: string;
  modelLabel: string;
}

const PromptForm: React.FC<PromptFormProps> = ({ 
  onSubmit, 
  initialPromptNumber, 
  aiModel,
  modelLabel
}) => {
  const [promptNumber, setPromptNumber] = useState(initialPromptNumber);
  const [wordCount, setWordCount] = useState(0);
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      prompt_title: "",
      prompt_content: "",
      promptNumber: promptNumber,
    },
  });

  // プロンプト番号が変更されたらフォームの値も更新
  useEffect(() => {
    promptForm.setValue("promptNumber", promptNumber);
  }, [promptNumber, promptForm]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    promptForm.setValue("prompt_content", content);
    setWordCount(content.length);
  };

  const handleSubmitForm = (data: PromptFormValues) => {
    onSubmit(data);
    // フォーム送信後にフォームをリセット
    promptForm.reset({
      prompt_title: "",
      prompt_content: "",
      promptNumber: promptNumber
    });
    // 文字数カウントもリセット
    setWordCount(0);
  };

  return (
    <Form {...promptForm}>
      <form onSubmit={promptForm.handleSubmit(handleSubmitForm)} className="space-y-8">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          {/* ヘッダー: プロンプト番号と使用AIモデル表示 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-black text-white font-medium shadow-sm mr-4">
                {promptNumber}
              </div>
              <h3 className="text-lg font-medium text-black">新しいプロンプト</h3>
            </div>
            
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
              {modelLabel}
            </div>
          </div>
          
          {/* タイトルと番号調整 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <FormField
              control={promptForm.control}
              name="prompt_title"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
                  <FormControl>
                    <Input
                      placeholder="プロンプトのタイトル"
                      className="text-lg font-medium border-gray-300"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex items-center border border-gray-300 rounded-md">
              <button 
                type="button"
                onClick={() => promptNumber > 1 && setPromptNumber(promptNumber - 1)}
                className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                disabled={promptNumber <= 1}
              >
                <ChevronDown size={16} />
              </button>
              <div className="flex items-center px-2">
                <Hash className="h-4 w-4 text-gray-500 mr-1" />
                <input
                  type="number"
                  value={promptNumber}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setPromptNumber(value);
                    }
                  }}
                  className="w-8 text-center border-none focus:outline-none"
                  min="1"
                />
              </div>
              <button 
                type="button"
                onClick={() => setPromptNumber(promptNumber + 1)}
                className="px-2 py-1 text-gray-500 hover:bg-gray-100"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
          
          {/* プロンプト内容 */}
          <FormField
            control={promptForm.control}
            name="prompt_content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="AIに送信したプロンプト内容を入力してください..."
                    className="min-h-[200px] border-gray-300 resize-none"
                    onChange={handleContentChange}
                    value={field.value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                プロンプト #{promptNumber}
              </span>
            </div>
            <Button 
              type="submit"
              className="bg-black hover:bg-gray-800 text-white "
            >
              プロンプトを追加
            </Button>
            <div>
              {wordCount} 文字
            </div>
          </div>
            
        </div>
        
        
      </form>
    </Form>
  );
};

export default PromptForm; 
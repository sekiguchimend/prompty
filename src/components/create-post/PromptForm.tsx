import React, { useState, useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash, AlertCircle } from "lucide-react";

// プロンプトフォームスキーマ
const promptFormSchema = z.object({
  prompt_content: z.string().min(10, "プロンプト内容は最低10文字以上入力してください"),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

export type PromptFormValues = z.infer<typeof promptFormSchema> & {
  prompt_title?: string;
};

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
  const [contentError, setContentError] = useState<string | null>(null);
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      prompt_content: "",
      promptNumber: promptNumber,
    },
  });

  // プロンプト番号が変更されたらフォームの値も更新
  useEffect(() => {
    promptForm.setValue("promptNumber", promptNumber);
  }, [promptNumber, promptForm]);

  // 編集イベントをリッスン
  useEffect(() => {
    const handleEditPrompt = (event: CustomEvent) => {
      const { id, content } = event.detail;
      if (id && content) {
        setPromptNumber(id);
        promptForm.setValue("prompt_content", content);
        setWordCount(content.length);
        setContentError(null);
      }
    };

    // カスタムイベントリスナーを追加
    window.addEventListener('edit-prompt', handleEditPrompt as EventListener);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('edit-prompt', handleEditPrompt as EventListener);
    };
  }, [promptForm]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    promptForm.setValue("prompt_content", content);
    setWordCount(content.length);
    
    // 文字数チェック
    if (content.length < 10) {
      setContentError("プロンプト内容は最低10文字以上入力してください");
    } else {
      setContentError(null);
    }
  };

  const handleSubmitForm = (data: PromptFormValues) => {
    // 文字数チェック
    if (data.prompt_content.length < 10) {
      setContentError("プロンプト内容は最低10文字以上入力してください");
      return;
    }
    
    // タイトルを追加
    const dataWithTitle = {
      ...data,
      prompt_title: `プロンプト #${promptNumber}`
    };
    
    onSubmit(dataWithTitle);
    // フォーム送信後にフォームをリセット
    promptForm.reset({
      prompt_content: "",
      promptNumber: promptNumber
    });
    // 文字数カウントもリセット
    setWordCount(0);
  };

  return (
    <div className="bg-white rounded-lg">
      <Form {...promptForm}>
        <form onSubmit={promptForm.handleSubmit(handleSubmitForm)} className="space-y-6 p-6">
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
          
          {/* プロンプト番号調整 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex-1"></div>
            
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
                    placeholder="AIに送信したプロンプト内容を入力してください...（最低10文字以上）"
                    className="min-h-[200px] border-gray-300 resize-none"
                    onChange={handleContentChange}
                    value={field.value}
                  />
                </FormControl>
                {(contentError || promptForm.formState.errors.prompt_content) && (
                  <div className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {contentError || promptForm.formState.errors.prompt_content?.message}
                  </div>
                )}
              </FormItem>
            )}
          />
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center md:justify-between text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                プロンプト #{promptNumber}
              </span>
            </div>
            
            <div className="flex items-center justify-end gap-4 w-full md:w-auto">
              <div className={`text-right min-w-[140px] ${wordCount < 10 ? "text-red-500" : ""}`}>
                <span>{wordCount} 文字</span>
                {wordCount < 10 && <span className="block md:inline md:ml-1">(最低10文字必要)</span>}
              </div>
              
              <Button 
                type="submit"
                className="bg-black hover:bg-gray-800 text-white whitespace-nowrap"
                disabled={wordCount < 10}
              >
                プロンプトを追加
              </Button>
            </div>
          </div>
            
        </form>
      </Form>
    </div>
  );
};

export default PromptForm; 
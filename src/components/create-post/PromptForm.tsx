import React, { useState, useEffect, useRef } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash, AlertCircle, Upload, Download, FileText, Info } from "lucide-react";

// シンプル化したプロンプトフォームスキーマ
const promptFormSchema = z.object({
  title: z.string().min(1, "タイトルは必須項目です"),
  fullPrompt: z.string().min(5, "プロンプトは最低5文字以上入力してください"),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

export type PromptFormValues = z.infer<typeof promptFormSchema> & {
  yaml_content?: string;
  file_content?: string;
};

interface PromptFormProps {
  onSubmit: (data: PromptFormValues) => void;
  initialPromptNumber: number;
  aiModel: string;
  modelLabel: string;
}

const SimplifiedPromptForm: React.FC<PromptFormProps> = ({ 
  onSubmit, 
  initialPromptNumber, 
  modelLabel
}) => {
  const [promptNumber, setPromptNumber] = useState(initialPromptNumber);
  const [yamlPreview, setYamlPreview] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [showNumberTooltip, setShowNumberTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: "",
      fullPrompt: "",
      promptNumber: promptNumber,
    },
  });

  // プロンプト番号が変更されたらフォームの値も更新
  useEffect(() => {
    promptForm.setValue("promptNumber", promptNumber);
    updateYamlPreview(promptForm.getValues());
  }, [promptNumber]);

  // フォームの値が変更されたらYAMLプレビューを更新
  useEffect(() => {
    const subscription = promptForm.watch((value) => {
      updateYamlPreview(value as PromptFormValues);
    });
    
    return () => subscription.unsubscribe();
  }, [promptForm]);

  // 編集イベントをリッスン
  useEffect(() => {
    const handleEditPrompt = (event: CustomEvent) => {
      const { id, data } = event.detail;
      if (id) {
        setPromptNumber(id);
        // YAMLデータからフォームフィールドを設定
        if (data) {
          const formData = typeof data === 'string' ? JSON.parse(data) : data;
          Object.keys(formData).forEach(key => {
            if (key in promptFormSchema.shape) {
              promptForm.setValue(key as keyof PromptFormValues, formData[key]);
            }
          });
        }
        updateYamlPreview(promptForm.getValues());
      }
    };

    // カスタムイベントリスナーを追加
    window.addEventListener('edit-prompt', handleEditPrompt as EventListener);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('edit-prompt', handleEditPrompt as EventListener);
    };
  }, [promptForm]);

  // YAML形式のプレビューを更新する関数
  const updateYamlPreview = (formData: PromptFormValues) => {
    if (!formData.title || !formData.fullPrompt) {
      setYamlPreview("");
      return;
    }
    
    const yamlEntries: string[] = [];
    
    yamlEntries.push(`id: ${promptNumber}`);
    yamlEntries.push(`title: "${formData.title}"`);
    
    // プロンプト本文をそのまま保持
    yamlEntries.push(`prompt: |
  ${formData.fullPrompt.split('\n').join('\n  ')}`);
    
    yamlEntries.push(`date: ${new Date().toISOString()}`);
    
    const yaml = `---
${yamlEntries.join('\n')}
---`;
    
    setYamlPreview(yaml);
  };

  // ファイルアップロードハンドラー
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      
      try {
        // YAMLコンテンツの処理
        const yamlContent = content.toString();
        
        // YAMLヘッダーとフッターを除去
        let cleanContent = yamlContent;
        if (cleanContent.startsWith('---')) {
          cleanContent = cleanContent.substring(3);
        }
        if (cleanContent.endsWith('---')) {
          cleanContent = cleanContent.substring(0, cleanContent.length - 3);
        }
        
        // タイトルの抽出
        const titleMatch = cleanContent.match(/title:\s*"([^"]*)"/);
        const title = titleMatch ? titleMatch[1] : "";
        
        // プロンプト本文の抽出
        let promptContent = "";
        const promptMatch = cleanContent.match(/prompt:\s*\|([\s\S]*?)(?=\w+:|$)/);
        if (promptMatch && promptMatch[1]) {
          // インデントを削除して本文を抽出
          promptContent = promptMatch[1].split('\n')
            .map(line => line.startsWith('  ') ? line.substring(2) : line)
            .join('\n')
            .trim();
        }
        
        // ID（プロンプト番号）の抽出
        const idMatch = cleanContent.match(/id:\s*(\d+)/);
        if (idMatch && idMatch[1]) {
          setPromptNumber(parseInt(idMatch[1]));
        }
        
        // フォームに値を設定
        if (title) promptForm.setValue('title', title);
        if (promptContent) promptForm.setValue('fullPrompt', promptContent);
        
        // YAMLプレビューを更新
        updateYamlPreview(promptForm.getValues());
      } catch (error) {
        console.error('YAMLファイルの解析に失敗しました:', error);
        alert('ファイルの解析に失敗しました。有効なYAML形式のファイルをアップロードしてください。');
      }
    };
    
    reader.readAsText(file);
  };

  // YAMLファイルをダウンロード
  const handleDownloadYaml = () => {
    if (!yamlPreview) return;
    
    const blob = new Blob([yamlPreview], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${promptNumber}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitForm = (data: PromptFormValues) => {
    // YAMLフォーマットを生成
    const yamlEntries: string[] = [];
    
    yamlEntries.push(`id: ${promptNumber}`);
    yamlEntries.push(`title: "${data.title}"`);
    
    // プロンプト本文をそのまま保持
    yamlEntries.push(`prompt: |
  ${data.fullPrompt.split('\n').join('\n  ')}`);
    
    yamlEntries.push(`date: ${new Date().toISOString()}`);
    
    const yamlContent = `---
${yamlEntries.join('\n')}
---`;
    
    const dataWithYaml = {
      ...data,
      yaml_content: yamlContent,
      file_content: fileContent
    };
    
    onSubmit(dataWithYaml);
    
    // フォーム送信後にフォームをリセット
    promptForm.reset({
      title: "",
      fullPrompt: "",
      promptNumber: promptNumber + 1
    });
    
    // YAMLプレビューもリセット
    setYamlPreview("");
    // ファイル関連の状態をリセット
    setFileContent("");
    setFileName("");
    // プロンプト番号も更新
    setPromptNumber(promptNumber + 1);
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
              <h3 className="text-lg font-medium text-black">プロンプト保存</h3>
            </div>
            
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
              {modelLabel}
            </div>
          </div>
          
      
          {/* プロンプト番号調整 - 改善されたUI */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">プロンプト管理番号</h4>
              <button
                type="button"
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowNumberTooltip(!showNumberTooltip)}
              >
                <Info size={16} />
              </button>
            </div>
            
            {showNumberTooltip && (
              <div className="mb-3 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                プロンプト管理番号は、保存したプロンプトを整理するための番号です。
                同じ種類のプロンプトには同じ番号を付けると、後で検索や整理がしやすくなります。
              </div>
            )}
            
            <div className="flex items-center">
              <div className="flex items-center border border-gray-300 rounded-md bg-white shadow-sm">
                <button 
                  type="button"
                  onClick={() => promptNumber > 1 && setPromptNumber(promptNumber - 1)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-r border-gray-300"
                  disabled={promptNumber <= 1}
                >
                  <ChevronDown size={16} />
                </button>
                <div className="flex items-center px-3 py-2">
                  <Hash className="h-4 w-4 text-gray-500 mr-2" />
                  <input
                    type="number"
                    value={promptNumber}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setPromptNumber(value);
                      }
                    }}
                    className="w-16 text-center border-none focus:outline-none bg-transparent"
                    min="1"
                    aria-label="プロンプト管理番号"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setPromptNumber(promptNumber + 1)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 border-l border-gray-300"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              
              <span className="ml-3 text-sm text-gray-500 hidden md:inline">
                同じ種類のプロンプトには同じ番号を使うと便利です
              </span>
              <span className="ml-3 text-sm text-gray-500 md:hidden">
                <span className="block">同じ種類のプロンプトには</span>
                <span className="block">同じ番号を使うと便利です</span>
              </span>
            </div>
          </div>
          
         
          {/* プロンプト全文 */}
          <FormField
            control={promptForm.control}
            name="fullPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">プロンプト全文</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="AIに送信したプロンプト全文をそのまま貼り付けてください"
                    className="min-h-[300px] border-gray-300"
                    {...field}
                  />
                </FormControl>
                {promptForm.formState.errors.fullPrompt && (
                  <div className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {promptForm.formState.errors.fullPrompt?.message}
                  </div>
                )}
              </FormItem>
            )}
          />
          
          {/* YAML プレビュー */}
          {yamlPreview && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">YAML プレビュー</h4>
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">{yamlPreview}</pre>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center md:justify-between text-sm text-gray-500 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                プロンプト #{promptNumber}
              </span>
            </div>
            
            <div className="flex items-center justify-end gap-4 w-full md:w-auto">
              <Button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
                disabled={!promptForm.formState.isValid}
              >
                プロンプトを保存
              </Button>
            </div>
          </div>
            
        </form>
      </Form>
    </div>
  );
};

export default SimplifiedPromptForm;
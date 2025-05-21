import React, { useState, useEffect, useRef } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash, AlertCircle, Upload, Download, FileText } from "lucide-react";

// プロンプトフォームスキーマ - YAML形式の入力項目
const promptFormSchema = z.object({
  role: z.string().min(1, "役割は必須項目です"),
  goal: z.string().min(5, "目標は最低5文字以上入力してください"),
  constraints: z.string().optional(),
  examples: z.string().optional(),
  format: z.string().optional(),
  tone: z.string().optional(),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

export type PromptFormValues = z.infer<typeof promptFormSchema> & {
  prompt_title?: string;
  yaml_content?: string;
  file_content?: string;
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
  const [yamlPreview, setYamlPreview] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      role: "",
      goal: "",
      constraints: "",
      examples: "",
      format: "",
      tone: "",
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
    // 空の値をフィルタリング
    const yamlEntries: string[] = [];
    
    yamlEntries.push(`id: ${promptNumber}`);
    yamlEntries.push(`model: "${aiModel}"`);
    
    if (formData.role) {
      yamlEntries.push(`role: |
  ${formData.role.split('\n').join('\n  ')}`);
    }
    
    if (formData.goal) {
      yamlEntries.push(`goal: |
  ${formData.goal.split('\n').join('\n  ')}`);
    }
    
    if (formData.constraints) {
      yamlEntries.push(`constraints: |
  ${formData.constraints.split('\n').join('\n  ')}`);
    }
    
    if (formData.examples) {
      yamlEntries.push(`examples: |
  ${formData.examples.split('\n').join('\n  ')}`);
    }
    
    if (formData.format) {
      yamlEntries.push(`format: |
  ${formData.format.split('\n').join('\n  ')}`);
    }
    
    if (formData.tone) {
      yamlEntries.push(`tone: |
  ${formData.tone.split('\n').join('\n  ')}`);
    }
    
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
        // YAMLコンテンツからフォームデータを抽出する
        // 簡易的なパース（より堅牢なライブラリを使用することも可能）
        const lines = content.split('\n');
        const dataMap: Record<string, string> = {};
        
        let currentKey = '';
        let currentValue = '';
        let isMultiline = false;
        
        for (const line of lines) {
          // YAMLのヘッダーとフッターをスキップ
          if (line.trim() === '---') continue;
          
          // キー: 値 の形式をパース
          const match = line.match(/^(\w+):\s*(.*)$/);
          if (match) {
            // 前の値を保存
            if (currentKey && currentValue) {
              dataMap[currentKey] = currentValue.trim();
            }
            
            currentKey = match[1];
            currentValue = match[2];
            
            // マルチライン判定
            if (currentValue.trim() === '|') {
              isMultiline = true;
              currentValue = '';
            } else {
              isMultiline = false;
              // 引用符を削除
              currentValue = currentValue.replace(/^["'](.*)["']$/, '$1');
            }
          } else if (isMultiline && line.startsWith('  ')) {
            // マルチライン値を連結
            currentValue += (currentValue ? '\n' : '') + line.substring(2);
          }
        }
        
        // 最後の値を保存
        if (currentKey && currentValue) {
          dataMap[currentKey] = currentValue.trim();
        }
        
        // フォームに値を設定
        if (dataMap.role) promptForm.setValue('role', dataMap.role);
        if (dataMap.goal) promptForm.setValue('goal', dataMap.goal);
        if (dataMap.constraints) promptForm.setValue('constraints', dataMap.constraints);
        if (dataMap.examples) promptForm.setValue('examples', dataMap.examples);
        if (dataMap.format) promptForm.setValue('format', dataMap.format);
        if (dataMap.tone) promptForm.setValue('tone', dataMap.tone);
        if (dataMap.id) setPromptNumber(parseInt(dataMap.id));
        
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
    yamlEntries.push(`model: "${aiModel}"`);
    
    if (data.role) {
      yamlEntries.push(`role: |
  ${data.role.split('\n').join('\n  ')}`);
    }
    
    if (data.goal) {
      yamlEntries.push(`goal: |
  ${data.goal.split('\n').join('\n  ')}`);
    }
    
    if (data.constraints) {
      yamlEntries.push(`constraints: |
  ${data.constraints.split('\n').join('\n  ')}`);
    }
    
    if (data.examples) {
      yamlEntries.push(`examples: |
  ${data.examples.split('\n').join('\n  ')}`);
    }
    
    if (data.format) {
      yamlEntries.push(`format: |
  ${data.format.split('\n').join('\n  ')}`);
    }
    
    if (data.tone) {
      yamlEntries.push(`tone: |
  ${data.tone.split('\n').join('\n  ')}`);
    }
    
    yamlEntries.push(`date: ${new Date().toISOString()}`);
    
    const yamlContent = `---
${yamlEntries.join('\n')}
---`;
    
    const dataWithYaml = {
      ...data,
      prompt_title: `プロンプト #${promptNumber}`,
      yaml_content: yamlContent,
      file_content: fileContent
    };
    
    onSubmit(dataWithYaml);
    
    // フォーム送信後にフォームをリセット
    promptForm.reset({
      role: "",
      goal: "",
      constraints: "",
      examples: "",
      format: "",
      tone: "",
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
              <h3 className="text-lg font-medium text-black">構造化プロンプト</h3>
            </div>
            
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
              {modelLabel}
            </div>
          </div>
          
          {/* ファイルアップロードセクション */}
          {/* <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-indigo-100 bg-indigo-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-indigo-600" />
                <div className="text-sm">
                  <span className="font-medium text-indigo-800">YAMLファイルをアップロード</span>
                  <p className="text-indigo-600 text-xs mt-1">
                    作成済みのYAMLプロンプトファイルをアップロードすると自動的にフォームに反映されます
                  </p>
                </div>
              </div>
              {fileName && (
                <div className="mt-2 text-xs text-indigo-700 flex items-center">
                  <span className="truncate max-w-xs">{fileName}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".yaml,.yml,.txt"
                className="hidden"
              />
              <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                ファイル選択
              </Button>
              {yamlPreview && (
                <Button 
                  type="button"
                  onClick={handleDownloadYaml}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
              )}
            </div>
          </div> */}
          
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
          
          {/* AIの役割 */}
          <FormField
            control={promptForm.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">AIの役割</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 高度なプログラミング講師、ビジネスコンサルタント"
                    className="border-gray-300"
                    {...field}
                  />
                </FormControl>
                {promptForm.formState.errors.role && (
                  <div className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {promptForm.formState.errors.role?.message}
                  </div>
                )}
              </FormItem>
            )}
          />
          
          {/* 目標 */}
          <FormField
            control={promptForm.control}
            name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">目標</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="AIに達成してほしい目標を明確に記述してください"
                    className="min-h-[80px] border-gray-300 resize-none"
                    {...field}
                  />
                </FormControl>
                {promptForm.formState.errors.goal && (
                  <div className="text-red-500 text-sm flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {promptForm.formState.errors.goal?.message}
                  </div>
                )}
              </FormItem>
            )}
          />
          
          {/* 制約条件 */}
          <FormField
            control={promptForm.control}
            name="constraints"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">制約条件 (オプション)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="AIが従うべき制限や条件を指定してください"
                    className="min-h-[80px] border-gray-300 resize-none"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* 例示 */}
          <FormField
            control={promptForm.control}
            name="examples"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">例示 (オプション)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="希望する回答の例や参考となる情報を提供してください"
                    className="min-h-[80px] border-gray-300 resize-none"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* フォーマット */}
          <FormField
            control={promptForm.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">出力フォーマット (オプション)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="回答の構造やフォーマットを指定してください（表、箇条書き、ステップなど）"
                    className="min-h-[80px] border-gray-300 resize-none"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* トーン */}
          <FormField
            control={promptForm.control}
            name="tone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">トーン (オプション)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="例: 専門的、カジュアル、教育的、励ましの"
                    className="border-gray-300"
                    {...field}
                  />
                </FormControl>
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
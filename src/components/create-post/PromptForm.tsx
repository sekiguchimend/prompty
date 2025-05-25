import React, { useState, useEffect, useRef } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash, AlertCircle, Upload, Download, FileText, Info, Save, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";

// シンプル化したプロンプトフォームスキーマ
const promptFormSchema = z.object({
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
  
  // アコーディオンの開閉状態
  const [openSections, setOpenSections] = useState({
    basic: true,     // 基本入力は最初から開いている
    advanced: false, // 高度な設定は最初は閉じている
    preview: false,  // プレビューは最初は閉じている
    file: false      // ファイル操作は最初は閉じている
  });
  
  // プロンプト入力フォーム
  const promptForm = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      fullPrompt: "",
      promptNumber: promptNumber,
    },
  });

  // セクションの開閉を切り替える
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
    if (!formData.fullPrompt) {
      setYamlPreview("");
      return;
    }
    
    const yamlEntries: string[] = [];
    
    yamlEntries.push(`id: ${promptNumber}`);
    yamlEntries.push(`title: "プロンプト #${promptNumber}"`);
    
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
    yamlEntries.push(`title: "プロンプト #${promptNumber}"`);
    
    // プロンプト本文をそのまま保持
    yamlEntries.push(`prompt: |
  ${data.fullPrompt.split('\n').join('\n  ')}`);
    
    yamlEntries.push(`date: ${new Date().toISOString()}`);
    
    const yamlContent = `---
${yamlEntries.join('\n')}
---`;
    
    const dataWithYaml = {
      ...data,
      title: `プロンプト #${promptNumber}`, // 自動生成タイトル
      yaml_content: yamlContent,
      file_content: fileContent
    };
    
    onSubmit(dataWithYaml);
    
    // フォーム送信後にフォームをリセット
    promptForm.reset({
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
    <div className="space-y-8">
      <Form {...promptForm}>
        <form onSubmit={promptForm.handleSubmit(handleSubmitForm)} className="space-y-8">
          {/* 基本入力セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <Collapsible open={openSections.basic} onOpenChange={() => toggleSection('basic')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-blue-300 transition-all duration-300 group ${
                  openSections.basic ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300 group-hover:scale-110">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">プロンプト内容</h4>
                        <p className="text-sm text-gray-600">AIに送信するプロンプト全文</p>
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
                  {/* プロンプト全文入力 */}
                  <FormField
                    control={promptForm.control}
                    name="fullPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900">プロンプト全文 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="AIに送信したプロンプト全文をそのまま貼り付けてください&#10;&#10;例：&#10;あなたは優秀なマーケターです。以下の商品について、魅力的な説明文を作成してください。&#10;&#10;商品名：[商品名]&#10;特徴：[特徴]&#10;ターゲット：[ターゲット顧客]"
                            className="min-h-[200px] resize-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                            {...field}
                          />
                        </FormControl>
                        {promptForm.formState.errors.fullPrompt && (
                          <div className="flex items-center text-red-600 text-sm mt-1 animate-in slide-in-from-left-2 duration-300">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {promptForm.formState.errors.fullPrompt?.message}
              </div>
                        )}
                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border mt-3 hover:bg-blue-50 transition-colors duration-300">
                          💡 プロンプトは実際にAIに送信した内容をそのまま貼り付けてください。変数部分（[商品名]など）も含めて記録することで、テンプレートとして再利用できます。
            </div>
                      </FormItem>
                    )}
                  />
            </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* 高度な設定セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection('advanced')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-purple-300 transition-all duration-300 group ${
                  openSections.advanced ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300 group-hover:scale-110">
                        <Hash className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">プロンプト管理設定</h4>
                        <p className="text-sm text-gray-600">番号管理とIDの設定</p>
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
                  <div className="flex items-center mb-3">
                    <Hash className="h-4 w-4 text-purple-600 mr-2" />
                    <h5 className="font-medium text-gray-900">プロンプト管理番号</h5>
              <button
                type="button"
                      className="ml-2 text-gray-400 hover:text-purple-600 transition-colors hover:scale-110 duration-300"
                onClick={() => setShowNumberTooltip(!showNumberTooltip)}
              >
                <Info size={16} />
              </button>
            </div>
            
            {showNumberTooltip && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">プロンプト管理番号とは？</p>
                        <p>保存したプロンプトを整理するための番号です。同じ種類のプロンプトには同じ番号を付けると、後で検索や整理がしやすくなります。</p>
                      </div>
              </div>
            )}
            
                  <div className="flex items-center justify-center">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <button 
                  type="button"
                  onClick={() => promptNumber > 1 && setPromptNumber(promptNumber - 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-all duration-300 border-r border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                  disabled={promptNumber <= 1}
                >
                  <ChevronDown size={16} />
                </button>
                      <div className="flex items-center px-4 py-2 bg-white min-w-[80px] justify-center">
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
                          className="w-10 text-center border-none focus:outline-none bg-transparent font-medium text-gray-900 focus:scale-110 transition-transform duration-300"
                    min="1"
                    aria-label="プロンプト管理番号"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setPromptNumber(promptNumber + 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-all duration-300 border-l border-gray-300 hover:scale-110"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
                  </div>
            </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* ファイル操作セクション */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
            <Collapsible open={openSections.file} onOpenChange={() => toggleSection('file')}>
              <CollapsibleTrigger asChild>
                <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-green-300 transition-all duration-300 group ${
                  openSections.file ? 'rounded-t-xl' : 'rounded-xl'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300 group-hover:scale-110">
                        <Upload className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors duration-300">ファイル操作</h4>
                        <p className="text-sm text-gray-600">YAMLファイルの読み込み・保存</p>
                      </div>
                    </div>
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      {openSections.file ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".yaml,.yml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-50 hover:scale-105 transition-all duration-300"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      YAMLファイル読込
                    </Button>
                    {fileName && (
                      <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 animate-in slide-in-from-right-2 duration-300">
                        {fileName}
                      </span>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* YAML プレビューセクション */}
          {yamlPreview && (
            <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
              <Collapsible open={openSections.preview} onOpenChange={() => toggleSection('preview')}>
                <CollapsibleTrigger asChild>
                  <div className={`bg-white border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-yellow-300 transition-all duration-300 group ${
                    openSections.preview ? 'rounded-t-xl' : 'rounded-xl'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-300 group-hover:scale-110">
                          <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors duration-300">YAML プレビュー</h4>
                          <p className="text-sm text-gray-600">生成されたYAMLファイルの確認</p>
                        </div>
                      </div>
                      <div className="transform transition-transform duration-300 group-hover:scale-110">
                        {openSections.preview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-300">
                  <div className="bg-white rounded-b-xl border-l border-r border-b border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">生成されたYAMLファイル</h5>
                      <Button
                        type="button"
                        onClick={handleDownloadYaml}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-50 hover:scale-105 transition-all duration-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ダウンロード
                      </Button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-40 hover:bg-gray-100 transition-colors duration-300">
                      <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">{yamlPreview}</pre>
                    </div>
              </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
          {/* 保存ボタンと説明 */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full animate-pulse">
                プロンプト #{promptNumber}
              </span>
            </div>
            
              <Button 
                type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg shadow-md transition-all duration-300 hover:shadow-xl hover:scale-105"
                disabled={!promptForm.formState.isValid}
              >
                  <Plus className="h-4 w-4 mr-2" />
                  プロンプトをリストに追加
              </Button>
              </div>
              
              {/* 説明テキスト */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p><span className="font-medium">保存について:</span> このボタンでプロンプトをリストに追加します。最終的な保存は画面下部の「プロジェクトを投稿」ボタンで行われます。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SimplifiedPromptForm;
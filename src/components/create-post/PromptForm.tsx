import React, { useState, useEffect, useRef } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel } from "../../components/ui/form";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown, ChevronUp, Hash, AlertCircle, Info, Save, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { PreviewMarkerOverlay } from "./PreviewMarkerOverlay";

// シンプル化したプロンプトフォームスキーマ
const promptFormSchema = z.object({
  fullPrompt: z.string().min(5, "プロンプトは最低5文字以上入力してください"),
  promptNumber: z.number().min(1, "プロンプト番号は1以上である必要があります"),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  onSubmit: (data: PromptFormValues) => void;
  initialPromptNumber: number;
  aiModel: string;
  modelLabel: string;
  onInsertPreviewMarker?: () => void;
  onPreviewLinesChange?: (lines: number) => void;
  initialPreviewLines?: number;
}

const SimplifiedPromptForm: React.FC<PromptFormProps> = ({ 
  onSubmit, 
  initialPromptNumber, 
  modelLabel,
  onInsertPreviewMarker,
  onPreviewLinesChange,
  initialPreviewLines
}) => {
  const [promptNumber, setPromptNumber] = useState(initialPromptNumber);
  const [showNumberTooltip, setShowNumberTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayContent, setDisplayContent] = useState(''); // 表示用コンテンツ
  const [previewLines, setPreviewLines] = useState<number>(initialPreviewLines || 3);
  const [showPreviewMarker, setShowPreviewMarker] = useState<boolean>(!!onInsertPreviewMarker);
  
  // アコーディオンの開閉状態
  const [openSections, setOpenSections] = useState({
    basic: true,     // 基本入力は最初から開いている
    advanced: false, // 高度な設定は最初は閉じている
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
  }, [promptNumber]);

  // マーカータグを非表示にする関数
  const hideMarkerTags = (content: string) => {
    return content.replace(/<!-- PREVIEW_END -->/g, '');
  };

  // 表示用コンテンツを更新する関数
  const updateDisplayContent = (content: string) => {
    setDisplayContent(hideMarkerTags(content));
  };

  // プレビュー行数変更のハンドラー
  const handlePreviewLinesChange = (lines: number) => {
    setPreviewLines(lines);
    if (onPreviewLinesChange) {
      onPreviewLinesChange(lines);
    }
  };

  // コンテンツ変更のハンドラー（マーカータグ挿入時）
  const handleContentChange = (newContent: string) => {
    // フォームの値を更新
    promptForm.setValue("fullPrompt", newContent);
    // 表示用コンテンツも更新
    updateDisplayContent(newContent);
  };

  // フォームの値が変更されたときの処理
  useEffect(() => {
    const subscription = promptForm.watch((value) => {
      if (value.fullPrompt) {
        updateDisplayContent(value.fullPrompt);
      }
    });
    return () => subscription.unsubscribe();
  }, [promptForm.watch]);

  // マーカー挿入機能
  const handleInsertPreviewMarker = () => {
    setShowPreviewMarker(!showPreviewMarker);
    
    // 親コンポーネントのコールバックを呼び出し
    if (onInsertPreviewMarker) {
      onInsertPreviewMarker();
    }
  };

  // 編集イベントをリッスン
  useEffect(() => {
    const handleEditPrompt = (event: CustomEvent) => {
      const { id, data } = event.detail;
      if (id) {
        setPromptNumber(id);
        // データからフォームフィールドを設定
        if (data) {
          const formData = typeof data === 'string' ? JSON.parse(data) : data;
          Object.keys(formData).forEach(key => {
            if (key in promptFormSchema.shape) {
              promptForm.setValue(key as keyof PromptFormValues, formData[key]);
              // fullPromptの場合は表示コンテンツも更新
              if (key === 'fullPrompt') {
                updateDisplayContent(formData[key]);
              }
            }
          });
        }
      }
    };

    // カスタムイベントリスナーを追加
    window.addEventListener('edit-prompt', handleEditPrompt as EventListener);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('edit-prompt', handleEditPrompt as EventListener);
    };
  }, [promptForm]);

  const handleSubmitForm = (data: PromptFormValues) => {
    const dataWithTitle = {
      ...data,
      title: `プロンプト #${promptNumber}`, // 自動生成タイトル
    };
    
    onSubmit(dataWithTitle);
    
    // フォーム送信後にフォームをリセット
    promptForm.reset({
      fullPrompt: "",
      promptNumber: promptNumber + 1
    });
    
    // プロンプト番号も更新
    setPromptNumber(promptNumber + 1);
  };

  return (
    <div className="space-y-6">
      <Form {...promptForm}>
        <form onSubmit={promptForm.handleSubmit(handleSubmitForm)} className="space-y-6">
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
                        <Save className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">プロンプト入力</h4>
                        <p className="text-sm text-gray-600">AIに送信するプロンプトを入力してください</p>
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
                  <FormField
                    control={promptForm.control}
                    name="fullPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-900">
                          プロンプト内容 <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              value={displayContent}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                // 実際のフォーム値にはマーカーを保持
                                const currentFormValue = promptForm.getValues("fullPrompt");
                                const markers = (currentFormValue.match(/<!-- PREVIEW_END -->/g) || []);
                                
                                // 新しい値にマーカーを再挿入（簡単な実装）
                                let updatedValue = newValue;
                                if (markers.length > 0) {
                                  // 最初のマーカーの位置を推定して再挿入
                                  const markerPosition = Math.min(newValue.length, currentFormValue.indexOf('<!-- PREVIEW_END -->'));
                                  if (markerPosition >= 0) {
                                    updatedValue = newValue.substring(0, markerPosition) + '<!-- PREVIEW_END -->' + newValue.substring(markerPosition);
                                  }
                                }
                                
                                field.onChange(updatedValue);
                                updateDisplayContent(updatedValue);
                              }}
                              ref={textareaRef}
                              placeholder=""
                              className="min-h-[300px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none relative z-10"
                            />
                            
                            {/* プレビューマーカーの視覚的表示 - 有料記事の場合のみ */}
                            {onInsertPreviewMarker && showPreviewMarker && (
                              <PreviewMarkerOverlay 
                                content={field.value} 
                                textareaRef={textareaRef}
                                onPreviewLinesChange={handlePreviewLinesChange}
                                onContentChange={handleContentChange}
                                initialPreviewLines={previewLines}
                              />
                            )}
                            
                            {/* マーカー挿入ボタン */}
                            {onInsertPreviewMarker && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleInsertPreviewMarker}
                                className="absolute top-2 right-2 flex items-center space-x-1 text-xs border-red-200 text-red-700 hover:bg-red-50 bg-white/90 backdrop-blur-sm z-30"
                              >
                                <div className="w-3 h-0.5 bg-red-500"></div>
                                <span>{showPreviewMarker ? '赤線を隠す' : '赤線を表示'}</span>
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <div className="text-sm text-gray-500 mt-2">
                          <p>• 具体的で分かりやすい指示を心がけてください</p>
                          <p>• 期待する出力形式も明記すると効果的です</p>
                          {onInsertPreviewMarker && (
                            <p>• 有料記事の場合は「プレビュー終了」ボタンで無料表示範囲を設定できます</p>
                          )}
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
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-300">詳細設定</h4>
                        <p className="text-sm text-gray-600">プロンプト番号などの詳細設定</p>
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
                    control={promptForm.control}
                    name="promptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium text-gray-900 flex items-center">
                          プロンプト番号
                          <div className="relative ml-2">
                            <Info 
                              className="h-4 w-4 text-gray-400 cursor-help" 
                              onMouseEnter={() => setShowNumberTooltip(true)}
                              onMouseLeave={() => setShowNumberTooltip(false)}
                            />
                            {showNumberTooltip && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-10 animate-in fade-in-0 zoom-in-95 duration-200">
                                プロンプトの管理用番号です
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={promptNumber}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value > 0) {
                                setPromptNumber(value);
                                field.onChange(value);
                              }
                            }}
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 w-32"
                            min="1"
                          />
                        </FormControl>
                        <div className="text-sm text-gray-500 mt-1">
                          自動で連番が設定されます
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* 保存ボタンと説明 */}
          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">プロンプトを保存</h4>
                    <p className="text-sm text-gray-600">
                      入力したプロンプトがプロジェクトに追加されます。
                      <br className="hidden sm:block" />
                      後から編集や削除も可能です。
                    </p>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 whitespace-nowrap"
                  disabled={!promptForm.watch("fullPrompt") || promptForm.watch("fullPrompt").length < 5}
                >
                  <Save className="h-4 w-4 mr-2" />
                  プロンプトを追加
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SimplifiedPromptForm;
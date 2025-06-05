'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Loader2, Wand2, Code, Play, Save, Share2, Copy, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { generateCode, improveCode, CodeGenerationRequest, CodeGenerationResponse } from '@/src/lib/gemini';
import CodeSandbox, { CodeFiles } from '@/src/components/CodeSandbox';

interface CodeGenerationTabProps {
  onCodeGenerated?: (code: CodeGenerationResponse) => void;
  onProjectSave?: (project: GeneratedCodeProject) => void;
}

export interface GeneratedCodeProject {
  id?: string;
  title: string;
  description: string;
  prompt: string;
  files: CodeFiles;
  dependencies: Record<string, string>;
  framework: string;
  language: string;
  styling: string;
  createdAt: Date;
  updatedAt: Date;
}

const CodeGenerationTab: React.FC<CodeGenerationTabProps> = ({ 
  onCodeGenerated, 
  onProjectSave 
}) => {
  const [prompt, setPrompt] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [model, setModel] = useState<'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-sonnet' | 'claude-3-haiku'>('gemini-2.0-flash');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generator');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: CodeGenerationRequest = {
        prompt: prompt.trim(),
        model: model
      };

      const response = await generateCode(request);
      setGeneratedCode(response);
      setPromptHistory([prompt.trim()]);
      setActiveTab('preview');
      onCodeGenerated?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コード生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!additionalPrompt.trim() || !generatedCode) {
      setError('改善内容を入力してください');
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      // 現在のコードを適切な形式で結合
      const currentCode = Object.entries(generatedCode.files)
        .map(([filename, content]) => `// ファイル: ${filename}\n${content}`)
        .join('\n\n');

      console.log('コード改善開始:', {
        originalFilesCount: Object.keys(generatedCode.files).length,
        framework: generatedCode.techStack?.framework,
        improvementRequest: additionalPrompt.trim()
      });

      const response = await improveCode(
        currentCode,
        additionalPrompt.trim(),
        generatedCode.techStack?.framework || 'react',
        model
      );

      console.log('コード改善完了:', {
        newFilesCount: Object.keys(response.files).length,
        description: response.description
      });

      // 改善されたコードで状態を更新
      setGeneratedCode(response);
      setPromptHistory(prev => [...prev, additionalPrompt.trim()]);
      setAdditionalPrompt('');
      
      // プレビュータブに自動切り替え
      setActiveTab('preview');
      
      // 成功通知
      console.log('✅ コードが正常に改善されました');
      
      onCodeGenerated?.(response);
    } catch (err) {
      console.error('❌ コード改善エラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'コード改善に失敗しました';
      setError(`改善エラー: ${errorMessage}`);
      
      // エラー時は改善プロンプトをクリアしない（再試行可能にする）
    } finally {
      setIsImproving(false);
    }
  };

  const handleReset = () => {
    setGeneratedCode(null);
    setPromptHistory([]);
    setAdditionalPrompt('');
    setError(null);
    setActiveTab('generator');
  };

  const handleSaveProject = () => {
    if (!generatedCode) return;

    const project: GeneratedCodeProject = {
      title: generatedCode.description || 'Generated Project',
      description: generatedCode.description || '',
      prompt,
      files: generatedCode.files,
      dependencies: generatedCode.dependencies?.reduce((acc: Record<string, string>, dep: string) => {
        acc[dep] = 'latest';
        return acc;
      }, {}) || {},
      framework: 'react',
      language: 'javascript',
      styling: 'css',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onProjectSave?.(project);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      const codeText = Object.entries(generatedCode.files)
        .map(([filename, content]) => `// ${filename}\n${content}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(codeText);
      // トースト通知を表示
      console.log('コードがクリップボードにコピーされました');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  const getTemplate = () => {
    if (generatedCode && generatedCode.techStack) {
      const { framework, language } = generatedCode.techStack;
      if (framework === 'react' && language === 'typescript') return 'react-ts';
      if (framework === 'react') return 'react';
      if (framework === 'vue' && language === 'typescript') return 'vue-ts';
      if (framework === 'vue') return 'vue';
      if (framework === 'nextjs') return 'nextjs';
      if (framework === 'svelte') return 'svelte';
      if (language === 'typescript') return 'vanilla-ts';
      return 'vanilla';
    }
    // フォールバック: ファイル拡張子から判断
    const fileNames = Object.keys(generatedCode?.files || {});
    if (fileNames.some(name => name.endsWith('.tsx'))) return 'react-ts';
    if (fileNames.some(name => name.endsWith('.jsx'))) return 'react';
    if (fileNames.some(name => name.endsWith('.vue'))) return 'vue';
    if (fileNames.some(name => name.endsWith('.ts'))) return 'vanilla-ts';
    return 'react'; // デフォルト
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">コード生成</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedCode}>プレビュー</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="w-6 h-6" />
                AI アプリジェネレーター
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                AIがあなたのアイデアを完全なアプリケーションに変換します
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* プロンプト入力 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-lg font-medium">何を作りたいですか？</Label>
                  <Textarea
                    id="prompt"
                    placeholder="例: シンプルなTodoアプリ、レスポンシブなランディングページ、ダッシュボード画面..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="resize-none text-base"
                  />
                </div>

                {/* AIモデル選択 */}
                <div className="flex items-center gap-4">
                  <Label htmlFor="model" className="text-sm font-medium whitespace-nowrap">AIモデル:</Label>
                  <Select value={model} onValueChange={(value: any) => setModel(value)}>
                    <SelectTrigger className="w-auto min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.0-flash">🔸 Gemini 2.0 Flash (推奨)</SelectItem>
                      <SelectItem value="gemini-1.5-pro">🔹 Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gpt-4">🔸 GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">🔹 GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3-sonnet">🔸 Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">🔹 Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 生成ボタン */}
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-6 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      AIが作成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-3" />
                      アプリを作成
                    </>
                  )}
                </Button>
              </div>

              {/* プロンプト履歴表示 */}
              {promptHistory.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">プロンプト履歴</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReset}
                      className="text-red-600 hover:text-red-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      リセット
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {promptHistory.map((historyPrompt, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {index === 0 ? '初回' : `改善 ${index}`}
                          </Badge>
                        </div>
                        <p className="text-gray-700">{historyPrompt}</p>
                      </div>
                    ))}
                  </div>

                  {/* 追加プロンプト入力 */}
                  <div className="space-y-2">
                    <Label htmlFor="additional-prompt">改善内容を追加</Label>
                    <Textarea
                      id="additional-prompt"
                      placeholder="現在のコードをどのように改善したいか詳しく説明してください..."
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* 改善ボタン */}
                  <Button 
                    onClick={handleImprove} 
                    disabled={isImproving || !additionalPrompt.trim()}
                    className={`w-full ${isImproving ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    variant="outline"
                  >
                    {isImproving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AIが改善中... お待ちください
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        コードを改善
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* エラー表示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500">⚠️</div>
                    <div className="flex-1">
                      <h4 className="text-red-800 font-medium mb-1">エラーが発生しました</h4>
                      <p className="text-red-700 text-sm mb-3">{error}</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setError(null)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          閉じる
                        </Button>
                        {error.includes('改善エラー') && additionalPrompt.trim() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleImprove}
                            disabled={isImproving}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            {isImproving ? '再試行中...' : '再試行'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {generatedCode && (
            <>
              {/* プロジェクト情報 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{generatedCode.description}</CardTitle>
                      {generatedCode.instructions && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {generatedCode.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* AIが自動選択した技術スタックを表示 */}
                      {generatedCode.techStack && (
                        <>
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            🤖 {generatedCode.techStack.framework}
                          </Badge>
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            🤖 {generatedCode.techStack.language}
                          </Badge>
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                            🤖 {generatedCode.techStack.styling}
                          </Badge>
                        </>
                      )}
                      {/* 使用されたAIモデルを表示 */}
                      {generatedCode.usedModel && (
                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                          🧠 {generatedCode.usedModel}
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={handleCopyCode}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSaveProject}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* プロンプト履歴 */}
              {promptHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">プロンプト履歴</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleReset}
                        className="text-red-600 hover:text-red-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        リセット
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {promptHistory.map((historyPrompt, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                              {index === 0 ? '初回生成' : `改善 ${index}`}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {index === promptHistory.length - 1 ? '最新' : ''}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{historyPrompt}</p>
                        </div>
                      ))}
                    </div>

                    {/* プレビュータブでの改善入力 */}
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <Label htmlFor="preview-additional-prompt">さらに改善する</Label>
                      <Textarea
                        id="preview-additional-prompt"
                        placeholder="現在のコードをどのように改善したいか詳しく説明してください..."
                        value={additionalPrompt}
                        onChange={(e) => setAdditionalPrompt(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <Button 
                        onClick={handleImprove} 
                        disabled={isImproving || !additionalPrompt.trim()}
                        className={`w-full ${isImproving ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                        variant="outline"
                      >
                        {isImproving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            AIが改善中... お待ちください
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            コードを改善
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* コードサンドボックス */}
              <CodeSandbox
                files={generatedCode.files}
                dependencies={generatedCode.dependencies?.reduce((acc: Record<string, string>, dep: string) => {
                  acc[dep] = 'latest';
                  return acc;
                }, {}) || {}}
                template={getTemplate() as any}
                title={generatedCode.description}
                description={generatedCode.instructions}
                height="600px"
                showConsole={true}
                showFileExplorer={true}
                editable={true}
                autorun={true}
                initialTab="preview"
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeGenerationTab; 
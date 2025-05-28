'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { Badge } from '@/src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Loader2, Wand2, Code, Play, Save, Share2, Copy, Download } from 'lucide-react';
import { generateCode, CodeGenerationRequest, CodeGenerationResponse } from '@/src/lib/gemini';
import CodeSandbox, { CodeFiles } from '@/src/components/CodeSandbox';

interface CodeGeneratorProps {
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

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ 
  onCodeGenerated, 
  onProjectSave 
}) => {
  const [prompt, setPrompt] = useState('');
  const [framework, setFramework] = useState<'react' | 'vue' | 'vanilla' | 'nextjs' | 'svelte'>('react');
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('typescript');
  const [styling, setStyling] = useState<'css' | 'tailwind' | 'styled-components' | 'emotion'>('tailwind');
  const [complexity, setComplexity] = useState<'simple' | 'intermediate' | 'advanced'>('intermediate');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generator');

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
        framework,
        language,
        styling,
        complexity
      };

      const response = await generateCode(request);
      setGeneratedCode(response);
      setActiveTab('preview');
      onCodeGenerated?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コード生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProject = () => {
    if (!generatedCode) return;

    const project: GeneratedCodeProject = {
      title: generatedCode.description || 'Generated Project',
      description: generatedCode.description || '',
      prompt,
      files: generatedCode.files,
      dependencies: generatedCode.dependencies?.reduce((acc, dep) => {
        acc[dep] = 'latest';
        return acc;
      }, {} as Record<string, string>) || {},
      framework,
      language,
      styling,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // ローカルストレージに保存
    const savedProjects = JSON.parse(localStorage.getItem('codeProjects') || '[]');
    project.id = Date.now().toString();
    savedProjects.push(project);
    localStorage.setItem('codeProjects', JSON.stringify(savedProjects));
    
    alert('プロジェクトが保存されました！');
    onProjectSave?.(project);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      const codeText = Object.entries(generatedCode.files)
        .map(([filename, content]) => `// ${filename}\n${content}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(codeText);
      alert('コードがクリップボードにコピーされました');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  const getTemplate = () => {
    if (framework === 'react' && language === 'typescript') return 'react-ts';
    if (framework === 'react' && language === 'javascript') return 'react';
    if (framework === 'vue' && language === 'typescript') return 'vue-ts';
    if (framework === 'vue' && language === 'javascript') return 'vue';
    if (framework === 'nextjs') return 'nextjs';
    if (framework === 'svelte') return 'svelte';
    return language === 'typescript' ? 'vanilla-ts' : 'vanilla';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator">コード生成</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedCode}>プレビュー</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AIコード生成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* プロンプト入力 */}
              <div className="space-y-2">
                <Label htmlFor="prompt">プロンプト</Label>
                <Textarea
                  id="prompt"
                  placeholder="作りたいアプリケーションやコンポーネントを詳しく説明してください..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* 設定オプション */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="framework">フレームワーク</Label>
                  <Select value={framework} onValueChange={(value: any) => setFramework(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="vue">Vue</SelectItem>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="svelte">Svelte</SelectItem>
                      <SelectItem value="vanilla">Vanilla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">言語</Label>
                  <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="styling">スタイリング</Label>
                  <Select value={styling} onValueChange={(value: any) => setStyling(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="styled-components">Styled Components</SelectItem>
                      <SelectItem value="emotion">Emotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complexity">複雑さ</Label>
                  <Select value={complexity} onValueChange={(value: any) => setComplexity(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">シンプル</SelectItem>
                      <SelectItem value="intermediate">中級</SelectItem>
                      <SelectItem value="advanced">上級</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 生成ボタン */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    コード生成中...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    コードを生成
                  </>
                )}
              </Button>

              {/* エラー表示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
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
                      <Badge variant="outline">{framework}</Badge>
                      <Badge variant="outline">{language}</Badge>
                      <Badge variant="outline">{styling}</Badge>
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

              {/* コードサンドボックス */}
              <CodeSandbox
                files={generatedCode.files}
                dependencies={generatedCode.dependencies?.reduce((acc, dep) => {
                  acc[dep] = 'latest';
                  return acc;
                }, {} as Record<string, string>) || {}}
                template={getTemplate() as any}
                title={generatedCode.description}
                description={generatedCode.instructions}
                height="600px"
                showConsole={true}
                showFileExplorer={true}
                editable={true}
                autorun={true}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeGenerator; 
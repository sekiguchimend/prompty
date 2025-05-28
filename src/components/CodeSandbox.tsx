'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Sandpack, 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer
} from '@codesandbox/sandpack-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Badge } from '@/src/components/ui/badge';
import { 
  Play, 
  Download, 
  Share2, 
  Code, 
  Eye, 
  Terminal,
  FolderOpen,
  Settings,
  Maximize2,
  Copy,
  Save
} from 'lucide-react';

export interface CodeFiles {
  [filename: string]: string;
}

export interface CodeSandboxProps {
  files: CodeFiles;
  dependencies?: Record<string, string>;
  template?: 'react' | 'react-ts' | 'vue' | 'vue-ts' | 'vanilla' | 'vanilla-ts' | 'nextjs' | 'svelte';
  theme?: 'light' | 'dark';
  height?: string;
  showConsole?: boolean;
  showFileExplorer?: boolean;
  editable?: boolean;
  autorun?: boolean;
  onFilesChange?: (files: CodeFiles) => void;
  onSave?: (files: CodeFiles) => void;
  title?: string;
  description?: string;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  files,
  dependencies = {},
  template = 'react-ts',
  theme = 'light',
  height = '600px',
  showConsole = true,
  showFileExplorer = true,
  editable = true,
  autorun = true,
  onFilesChange,
  onSave,
  title,
  description
}) => {
  const [currentFiles, setCurrentFiles] = useState<CodeFiles>(files);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    setCurrentFiles(files);
  }, [files]);

  const handleFilesChange = (newFiles: CodeFiles) => {
    setCurrentFiles(newFiles);
    onFilesChange?.(newFiles);
  };

  const handleSave = () => {
    onSave?.(currentFiles);
  };

  const handleDownload = () => {
    // ファイルをZIPとしてダウンロード
    const zip = new JSZip();
    Object.entries(currentFiles).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleShare = async () => {
    // プロジェクトを共有用URLとして生成
    const projectData = {
      files: currentFiles,
      dependencies,
      template,
      title,
      description
    };
    
    const encoded = btoa(JSON.stringify(projectData));
    const shareUrl = `${window.location.origin}/sandbox?data=${encoded}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      // トースト通知を表示
      console.log('共有URLがクリップボードにコピーされました');
      alert('共有URLがクリップボードにコピーされました');
    } catch (error) {
      console.error('共有URLのコピーに失敗しました:', error);
    }
  };

  // テンプレート名を修正
  const getValidTemplate = () => {
    if (template === 'nextjs') return 'nextjs';
    return template;
  };

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{template}</Badge>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!editable}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div style={{ height }}>
          <SandpackProvider
            template={getValidTemplate()}
            files={currentFiles}
            customSetup={{
              dependencies: {
                ...dependencies
              }
            }}
            theme={theme === 'dark' ? 'dark' : 'light'}
            options={{
              autorun
            }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  プレビュー
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  コード
                </TabsTrigger>
                {showConsole && (
                  <TabsTrigger value="console" className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    コンソール
                  </TabsTrigger>
                )}
                {showFileExplorer && (
                  <TabsTrigger value="files" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    ファイル
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="preview" className="h-full mt-0">
                <SandpackLayout>
                  <SandpackPreview 
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                    showOpenNewtab={true}
                  />
                </SandpackLayout>
              </TabsContent>

              <TabsContent value="code" className="h-full mt-0">
                <SandpackLayout>
                  {showFileExplorer && <SandpackFileExplorer />}
                  <SandpackCodeEditor 
                    showTabs={true}
                    showLineNumbers={true}
                    showInlineErrors={true}
                    wrapContent={true}
                    readOnly={!editable}
                  />
                  <SandpackPreview 
                    showOpenInCodeSandbox={false}
                    showRefreshButton={true}
                  />
                </SandpackLayout>
              </TabsContent>

              {showConsole && (
                <TabsContent value="console" className="h-full mt-0">
                  <SandpackLayout>
                    <SandpackCodeEditor 
                      showTabs={true}
                      readOnly={!editable}
                    />
                    <div className="flex flex-col">
                      <SandpackPreview showOpenInCodeSandbox={false} />
                      <SandpackConsole />
                    </div>
                  </SandpackLayout>
                </TabsContent>
              )}

              {showFileExplorer && (
                <TabsContent value="files" className="h-full mt-0">
                  <SandpackLayout>
                    <SandpackFileExplorer />
                    <SandpackCodeEditor 
                      showTabs={true}
                      readOnly={!editable}
                    />
                    <SandpackPreview showOpenInCodeSandbox={false} />
                  </SandpackLayout>
                </TabsContent>
              )}
            </Tabs>
          </SandpackProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeSandbox; 
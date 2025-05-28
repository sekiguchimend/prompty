import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import CodeSandbox, { CodeFiles } from '@/src/components/CodeSandbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface ProjectData {
  files: CodeFiles;
  dependencies?: Record<string, string>;
  template?: string;
  title?: string;
  description?: string;
}

const SandboxPage: React.FC = () => {
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { data } = router.query;
      
      if (typeof data === 'string') {
        try {
          const decoded = atob(data);
          const parsed = JSON.parse(decoded);
          setProjectData(parsed);
        } catch (err) {
          setError('プロジェクトデータの読み込みに失敗しました');
        }
      } else {
        setError('プロジェクトデータが見つかりません');
      }
      
      setIsLoading(false);
    }
  }, [router.isReady, router.query]);

  const handleGoBack = () => {
    router.push('/code-generator');
  };

  const handleOpenInNewTab = () => {
    if (projectData) {
      const encoded = btoa(JSON.stringify(projectData));
      window.open(`${window.location.origin}/sandbox?data=${encoded}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <>
        <Head>
          <title>エラー - Sandbox</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">エラー</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                {error || 'プロジェクトデータが見つかりません'}
              </p>
              <Button onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                コード生成に戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{projectData.title || 'Sandbox'} - Prompty</title>
        <meta name="description" content={projectData.description || 'コードサンドボックス'} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  戻る
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {projectData.title || 'コードサンドボックス'}
                  </h1>
                  {projectData.description && (
                    <p className="text-gray-600 mt-1">{projectData.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {projectData.template && (
                  <Badge variant="secondary">{projectData.template}</Badge>
                )}
                <Button variant="outline" onClick={handleOpenInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  新しいタブで開く
                </Button>
              </div>
            </div>
          </div>

          {/* コードサンドボックス */}
          <div className="w-full">
            <CodeSandbox
              files={projectData.files}
              dependencies={projectData.dependencies || {}}
              template={projectData.template as any}
              title={projectData.title}
              description={projectData.description}
              height="calc(100vh - 200px)"
              showConsole={true}
              showFileExplorer={true}
              editable={true}
              autorun={true}
            />
          </div>

          {/* フッター情報 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Promptyで生成されたプロジェクト</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SandboxPage; 
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import CodeGenerator, { GeneratedCodeProject } from '@/src/components/CodeGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Trash2, ExternalLink } from 'lucide-react';

const CodeGeneratorPage: React.FC = () => {
  const [savedProjects, setSavedProjects] = useState<GeneratedCodeProject[]>([]);

  useEffect(() => {
    // ローカルストレージから保存されたプロジェクトを読み込み
    const projects = JSON.parse(localStorage.getItem('codeProjects') || '[]');
    setSavedProjects(projects);
  }, []);

  const handleProjectSave = (project: GeneratedCodeProject) => {
    setSavedProjects(prev => [...prev, project]);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem('codeProjects', JSON.stringify(updatedProjects));
  };

  const handleOpenProject = (project: GeneratedCodeProject) => {
    const projectData = {
      files: project.files,
      dependencies: project.dependencies,
      template: project.framework,
      title: project.title,
      description: project.description
    };
    
    const encoded = btoa(JSON.stringify(projectData));
    window.open(`${window.location.origin}/sandbox?data=${encoded}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>AIコード生成 - Prompty</title>
        <meta name="description" content="AIを使ってコードを生成し、リアルタイムでプレビューできます" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  AIコード生成
                </h1>
                <p className="text-gray-600">
                  AIを使ってWebアプリケーションのコードを生成し、リアルタイムでプレビューできます
                </p>
              </div>

              <CodeGenerator onProjectSave={handleProjectSave} />
            </div>

            {/* サイドバー */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">保存されたプロジェクト</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savedProjects.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      まだプロジェクトがありません
                    </p>
                  ) : (
                    savedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">
                            {project.title}
                          </h4>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenProject(project)}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id!)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {project.framework}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {project.language}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {project.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* 技術スタック情報 */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">技術スタック</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">フレームワーク</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">React</Badge>
                      <Badge variant="outline">Vue</Badge>
                      <Badge variant="outline">Next.js</Badge>
                      <Badge variant="outline">Svelte</Badge>
                      <Badge variant="outline">Vanilla</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">スタイリング</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">Tailwind CSS</Badge>
                      <Badge variant="outline">CSS</Badge>
                      <Badge variant="outline">Styled Components</Badge>
                      <Badge variant="outline">Emotion</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">言語</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">TypeScript</Badge>
                      <Badge variant="outline">JavaScript</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeGeneratorPage; 
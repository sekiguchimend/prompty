import { useState, useEffect, useCallback } from 'react';
import { generateCode, improveCode, CodeGenerationResponse } from '@/src/lib/gemini';

export type ModelType = 'claude-3-7-sonnet-20250219' | 'claude-3-5-sonnet-20241022' | 'claude-3-sonnet-20240229' | 'claude-3-opus-20240229';

export interface ProjectHistory {
  id: string;
  projectName: string;
  initialPrompt: string;
  timestamp: Date;
  model: string;
  framework: string;
  fileCount: number;
  result: CodeGenerationResponse;
  improvements: Array<{
    id: string;
    prompt: string;
    timestamp: Date;
    result: CodeGenerationResponse;
  }>;
}

export const useCodeGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('claude-3-7-sonnet-20250219');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('codeGeneratorProjectHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          improvements: item.improvements.map((imp: any) => ({
            ...imp,
            timestamp: new Date(imp.timestamp)
          }))
        })));
      }
    } catch (error) {
      console.error('履歴の読み込みに失敗:', error);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: ProjectHistory[]) => {
    try {
      localStorage.setItem('codeGeneratorProjectHistory', JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error('履歴の保存に失敗:', error);
    }
  }, []);

  // Create new project in history
  const createProject = useCallback((result: CodeGenerationResponse) => {
    const projectId = Date.now().toString();
    const project: ProjectHistory = {
      id: projectId,
      projectName: prompt.trim().substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      initialPrompt: prompt.trim(),
      timestamp: new Date(),
      model,
      framework: result.framework,
      fileCount: Object.keys(result.files).length,
      result,
      improvements: []
    };
    
    const newHistory = [project, ...history.slice(0, 19)];
    saveHistory(newHistory);
    setCurrentProjectId(projectId);
    return projectId;
  }, [prompt, model, history, saveHistory]);

  // Add improvement to current project
  const addImprovement = useCallback((improvementPrompt: string, result: CodeGenerationResponse) => {
    if (!currentProjectId) return;

    const improvement = {
      id: Date.now().toString(),
      prompt: improvementPrompt,
      timestamp: new Date(),
      result
    };

    const newHistory = history.map(project => {
      if (project.id === currentProjectId) {
        return {
          ...project,
          improvements: [improvement, ...project.improvements],
          result, // Update the main result to the latest improvement
          fileCount: Object.keys(result.files).length
        };
      }
      return project;
    });

    saveHistory(newHistory);
  }, [currentProjectId, history, saveHistory]);

  // Generate code
  const handleGenerateCode = useCallback(async () => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateCode({ prompt: prompt.trim(), model, language: 'ja' });
      setGeneratedCode(result);
      createProject(result);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'コード生成に失敗しました');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, model, createProject]);

  // Improve code with enhanced preservation
  const handleImproveCode = useCallback(async (improvementPrompt: string) => {
    if (!generatedCode || !improvementPrompt.trim()) {
      setError('改善要求を入力してください');
      return;
    }
    setIsImproving(true);
    setError(null);
    try {
      // 🔧 文字数制限を考慮したファイル連結（改善版）
      let allFiles = '';
      let totalLength = 0;
      const maxTotalLength = 180000; // 200,000文字の余裕を残す
      const maxFileLength = 30000; // 単一ファイルの最大長
      
      for (const [filename, content] of Object.entries(generatedCode.files)) {
        let fileContent = content;
        
        // 個別ファイルが長すぎる場合は一部のみ使用
        if (fileContent.length > maxFileLength) {
          fileContent = fileContent.substring(0, maxFileLength) + '\n\n// ... (ファイルが長いため省略) ...';
        }
        
        const fileSection = `// ${filename}\n${fileContent}\n\n`;
        
        // 合計文字数チェック
        if (totalLength + fileSection.length > maxTotalLength) {
          allFiles += `// ${filename}\n// (文字数制限により省略)\n\n`;
          break;
        }
        
        allFiles += fileSection;
        totalLength += fileSection.length;
      }
      
      
      // 🔧 JSONフォーマットで送信（既存コード保護強化）
      const codePackage = JSON.stringify({
        files: generatedCode.files,
        metadata: {
          framework: generatedCode.framework,
          language: generatedCode.language,
          styling: generatedCode.styling,
          description: generatedCode.description
        }
      });
      
      const result = await improveCode(
        codePackage, // JSONフォーマットで既存コードを送信
        improvementPrompt.trim(),
        generatedCode.framework,
        model,
        'ja',
        {
          preserveStructure: true,
          preserveStyles: true,
          preserveFunctionality: true,
          enhanceOnly: true,
          targetAreas: improvementPrompt.toLowerCase().includes('css') ? ['styling'] :
                      improvementPrompt.toLowerCase().includes('javascript') ? ['functionality'] :
                      improvementPrompt.toLowerCase().includes('html') ? ['structure'] :
                      ['all']
        }
      );
      
      setGeneratedCode(result);
      addImprovement(improvementPrompt, result);
      
      
      return result;
    } catch (error) {
      console.error('❌ コード改善エラー:', error);
      setError(error instanceof Error ? error.message : 'コード改善に失敗しました。より具体的な改善要求で再度お試しください。');
      throw error;
    } finally {
      setIsImproving(false);
    }
  }, [generatedCode, model, addImprovement]);

  // Load project from history
  const loadProject = useCallback((project: ProjectHistory) => {
    setGeneratedCode(project.result);
    setPrompt(project.initialPrompt);
    setModel(project.model as ModelType);
    setCurrentProjectId(project.id);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('codeGeneratorProjectHistory');
    setCurrentProjectId(null);
  }, []);

  // Revert to initial project state
  const revertToInitial = useCallback((projectId?: string) => {
    const targetId = projectId || currentProjectId;
    if (!targetId) return;

    const project = history.find(p => p.id === targetId);
    if (!project) return;

    // Reset to initial state without improvements
    setGeneratedCode(project.result);
    setPrompt(project.initialPrompt);
    setModel(project.model as ModelType);
    setCurrentProjectId(project.id);

    // Remove all improvements from this project
    const newHistory = history.map(p => {
      if (p.id === targetId) {
        return {
          ...p,
          improvements: [],
          result: project.result // Reset to original result
        };
      }
      return p;
    });

    saveHistory(newHistory);
  }, [currentProjectId, history, saveHistory]);

  // Revert to specific improvement state
  const revertToImprovement = useCallback((projectId: string, improvementId: string) => {
    const project = history.find(p => p.id === projectId);
    if (!project) return;

    const improvementIndex = project.improvements.findIndex(imp => imp.id === improvementId);
    if (improvementIndex === -1) return;

    // Get the target improvement
    const targetImprovement = project.improvements[improvementIndex];
    
    // Set current state to the target improvement
    setGeneratedCode(targetImprovement.result);
    setPrompt(project.initialPrompt);
    setModel(project.model as ModelType);
    setCurrentProjectId(project.id);

    // Remove all improvements after this one (keep improvements up to this point)
    const newHistory = history.map(p => {
      if (p.id === projectId) {
        const keptImprovements = project.improvements.slice(improvementIndex);
        return {
          ...p,
          improvements: keptImprovements,
          result: targetImprovement.result
        };
      }
      return p;
    });

    saveHistory(newHistory);
  }, [history, saveHistory]);

  // Get current project details (for UI display)
  const getCurrentProject = useCallback(() => {
    if (!currentProjectId) return null;
    return history.find(p => p.id === currentProjectId);
  }, [currentProjectId, history]);

  return {
    prompt,
    setPrompt,
    model,
    setModel,
    isGenerating,
    isImproving,
    generatedCode,
    setGeneratedCode,
    error,
    setError,
    history,
    currentProjectId,
    handleGenerateCode,
    handleImproveCode,
    loadProject,
    clearHistory,
    revertToInitial,
    revertToImprovement,
    getCurrentProject
  };
}; 
import { useState, useCallback } from 'react';
import { UIGenerationRequest, UIGenerationResponse } from '../lib/utils/types';

type GenerationMode = 'single';

interface VersionHistoryItem extends UIGenerationResponse {
  id: string;
  timestamp: Date;
  prompt: string;
  type: 'generated' | 'improved';
}

export const useUIGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 生成モード（単一ページのみ）
  const [generationMode, setGenerationMode] = useState<GenerationMode>('single');
  
  // 単一ページモード
  const [generatedUI, setGeneratedUI] = useState<UIGenerationResponse | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionHistoryItem[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  
  // 共通関数
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateUI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 UI生成開始:', prompt.substring(0, 100) + '...');

      // API リクエスト作成
      const request: UIGenerationRequest = {
        prompt: prompt.trim(),
        isIteration: false
      };

      // API呼び出し
      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API エラー: ${response.status}`);
      }

      const result: UIGenerationResponse = await response.json();
      
      console.log('✅ UI生成完了:', {
        htmlLength: result.html?.length || 0,
        cssLength: result.css?.length || 0,
        jsLength: result.js?.length || 0,
      });

      // 単一ページモード
      const newVersion: VersionHistoryItem = {
        ...result,
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: prompt.trim(),
        type: 'generated'
      };

      setVersionHistory([newVersion]);
      setCurrentVersionIndex(0);
      setGeneratedUI(result);
      
      console.log('📚 Version history updated:', {
        totalVersions: 1,
        currentIndex: 0
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UI生成に失敗しました';
      console.error('❌ UI生成エラー:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const improveUI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('改善指示を入力してください');
      return;
    }

    if (!generatedUI) {
      setError('改善するUIがありません。まず新しいUIを生成してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔄 UI改善開始:', prompt.substring(0, 100) + '...');

      // API リクエスト作成
      const request: UIGenerationRequest = {
        prompt: prompt.trim(),
        existingCode: {
          html: generatedUI.html,
          css: generatedUI.css,
          js: generatedUI.js
        },
        isIteration: true
      };

      // API呼び出し
      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API エラー: ${response.status}`);
      }

      const result: UIGenerationResponse = await response.json();
      
      console.log('✅ UI改善完了:', {
        htmlLength: result.html?.length || 0,
        cssLength: result.css?.length || 0,
        jsLength: result.js?.length || 0,
      });

      // 単一ページモード
      const newVersion: VersionHistoryItem = {
        ...result,
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: prompt.trim(),
        type: 'improved'
      };

      const newHistory = versionHistory.slice(0, currentVersionIndex + 1);
      newHistory.push(newVersion);
      
      setVersionHistory(newHistory);
      setCurrentVersionIndex(newHistory.length - 1);
      setGeneratedUI(result);
      
      console.log('📚 Version history updated:', {
        totalVersions: newHistory.length,
        currentIndex: newHistory.length - 1
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UI改善に失敗しました';
      console.error('❌ UI改善エラー:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [generatedUI, versionHistory, currentVersionIndex]);

  const clearUI = useCallback(() => {
    console.log('🗑️ UI clear requested');
    setGeneratedUI(null);
    setVersionHistory([]);
    setCurrentVersionIndex(-1);
    setError(null);
    console.log('✅ UI cleared');
  }, []);

  // バージョン操作関数
  const undoLastChange = useCallback(() => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setGeneratedUI(versionHistory[newIndex]);
      console.log('↶ Undo to version', newIndex + 1);
      return true;
    }
    return false;
  }, [currentVersionIndex, versionHistory]);

  const redoLastChange = useCallback(() => {
    if (currentVersionIndex < versionHistory.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setGeneratedUI(versionHistory[newIndex]);
      console.log('↷ Redo to version', newIndex + 1);
      return true;
    }
    return false;
  }, [currentVersionIndex, versionHistory]);

  const goToVersion = useCallback((versionIndex: number) => {
    if (versionIndex >= 0 && versionIndex < versionHistory.length) {
      setCurrentVersionIndex(versionIndex);
      setGeneratedUI(versionHistory[versionIndex]);
      console.log('🔄 Switched to version', versionIndex + 1);
      return true;
    }
    return false;
  }, [versionHistory]);

  const goToFirstVersion = useCallback(() => {
    if (versionHistory.length > 0) {
      setCurrentVersionIndex(0);
      setGeneratedUI(versionHistory[0]);
      console.log('⏮️ Switched to first version');
      return true;
    }
    return false;
  }, [versionHistory]);

  const goToLatestVersion = useCallback(() => {
    if (versionHistory.length > 0) {
      const latestIndex = versionHistory.length - 1;
      setCurrentVersionIndex(latestIndex);
      setGeneratedUI(versionHistory[latestIndex]);
      console.log('⏭️ Switched to latest version');
      return true;
    }
    return false;
  }, [versionHistory]);

  // バージョン情報を取得
  const getVersionInfo = useCallback(() => {
    return {
      current: currentVersionIndex + 1,
      total: versionHistory.length,
      versions: versionHistory.map((version, index) => ({
        ...version,
        index,
        isCurrent: index === currentVersionIndex
      }))
    };
  }, [versionHistory, currentVersionIndex]);

  return {
    // 基本状態
    isGenerating,
    error,
    
    // モード管理（単一ページのみ）
    generationMode,
    setGenerationMode,
    
    // 単一ページモード
    generatedUI,
    versionHistory,
    currentVersionIndex,
    canUndo: currentVersionIndex > 0,
    canRedo: currentVersionIndex < versionHistory.length - 1,
    
    // 基本機能
    generateUI,
    improveUI,
    clearUI,
    clearError,
    
    // バージョン操作
    undoLastChange,
    redoLastChange,
    goToVersion,
    goToFirstVersion,
    goToLatestVersion,
    getVersionInfo
  };
}; 
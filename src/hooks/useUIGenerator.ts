import { useState, useCallback } from 'react';

interface UIGenerationResponse {
  html: string;
  css: string;
  js: string;
  description: string;
}

export const useUIGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUI, setGeneratedUI] = useState<UIGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousVersions, setPreviousVersions] = useState<UIGenerationResponse[]>([]);

  const generateUI = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedUI(null);

    try {
      console.log('🚀 UI生成開始:', prompt);

      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          isIteration: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ UI生成完了:', {
        htmlLength: result.html?.length || 0,
        cssLength: result.css?.length || 0,
        jsLength: result.js?.length || 0,
        description: result.description
      });

      // JSコンテンツの詳細チェック
      if (!result.js || result.js.trim().length === 0) {
        console.warn('⚠️ JavaScript content is empty or missing!');
      } else {
        console.log('✅ JavaScript content found:', result.js.substring(0, 200) + '...');
      }

      setGeneratedUI(result);
      setPreviousVersions([]); // 新規生成時は履歴をクリア
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

  const improveUI = useCallback(async (improvementPrompt: string) => {
    if (!improvementPrompt.trim()) {
      setError('改善内容を入力してください');
      return;
    }

    if (!generatedUI) {
      setError('改善するUIがありません。まず最初にUIを生成してください');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔄 UI改善開始:', improvementPrompt);

      // 現在のバージョンを履歴に保存
      setPreviousVersions(prev => [...prev, generatedUI]);

      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: improvementPrompt.trim(),
          existingCode: {
            html: generatedUI.html,
            css: generatedUI.css,
            js: generatedUI.js
          },
          isIteration: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ UI改善完了:', {
        htmlLength: result.html?.length || 0,
        cssLength: result.css?.length || 0,
        jsLength: result.js?.length || 0,
        description: result.description
      });

      // JSコンテンツの詳細チェック
      if (!result.js || result.js.trim().length === 0) {
        console.warn('⚠️ JavaScript content is empty or missing after improvement!');
      } else {
        console.log('✅ JavaScript content found after improvement:', result.js.substring(0, 200) + '...');
      }

      setGeneratedUI(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UI改善に失敗しました';
      console.error('❌ UI改善エラー:', errorMessage);
      setError(errorMessage);
      
      // エラー時は履歴から最後のバージョンを復元
      setPreviousVersions(prev => {
        if (prev.length > 0) {
          const restored = prev[prev.length - 1];
          setGeneratedUI(restored);
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [generatedUI]);

  const undoLastChange = useCallback(() => {
    if (previousVersions.length > 0) {
      const previousVersion = previousVersions[previousVersions.length - 1];
      setGeneratedUI(previousVersion);
      setPreviousVersions(prev => prev.slice(0, -1));
      console.log('↩️ 前のバージョンに戻しました');
      return true;
    }
    return false;
  }, [previousVersions]);

  const clearUI = useCallback(() => {
    setGeneratedUI(null);
    setError(null);
    setPreviousVersions([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedUI,
    error,
    previousVersions,
    canUndo: previousVersions.length > 0,
    generateUI,
    improveUI,
    undoLastChange,
    clearUI,
    clearError
  };
}; 
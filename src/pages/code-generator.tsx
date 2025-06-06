import React, { useState, useCallback, useEffect } from 'react';
import { useUIGenerator } from '../hooks/useUIGenerator';
import TypingCodeDisplay from '../components/code-generator/TypingCodeDisplay';
import UIPreview from '../components/code-generator/UIPreview';
import { 
  Sparkles, 
  Wand2, 
  RotateCcw, 
  RotateCw,
  History,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  SkipBack,
  SkipForward
} from 'lucide-react';

const CodeGeneratorPage: React.FC = () => {
  const {
    isGenerating,
    error,
    generationMode,
    setGenerationMode,
    generatedUI,
    versionHistory,
    currentVersionIndex,
    canUndo,
    canRedo,
    generateUI,
    improveUI,
    clearUI,
    clearError,
    undoLastChange,
    redoLastChange,
    goToVersion,
    goToFirstVersion,
    goToLatestVersion,
    getVersionInfo
  } = useUIGenerator();

  const [prompt, setPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [typingCompleted, setTypingCompleted] = useState(false);

  const versionInfo = getVersionInfo();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      await generateUI(prompt);
      setTypingCompleted(false);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleImprove = async () => {
    if (!prompt.trim()) return;
    
    try {
      await improveUI(prompt);
      setTypingCompleted(false);
    } catch (err) {
      console.error('Improvement failed:', err);
    }
  };

  const handleClear = () => {
    clearUI();
    setPrompt('');
    setTypingCompleted(false);
  };

  const handleTypingComplete = useCallback(() => {
    setTypingCompleted(true);
  }, []);

  const handleVersionChange = (versionIndex: number) => {
    goToVersion(versionIndex);
    setTypingCompleted(true);
  };

  const handlePromptExample = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const examplePrompts = [
    "ログイン画面を作って。メールとパスワード欄付きで。",
    "モダンなTodoアプリを作成してください。",
    "シンプルな電卓アプリを作って。",
    "お問い合わせフォームを作成してください。",
    "プロフィールカードのデザインをお願いします。",
    "ダッシュボードの画面を作ってください。"
  ];

  const improvementExamples = [
    "もっとモダンなデザインにして",
    "ダークモードに対応させて", 
    "アニメーションを追加して",
    "レスポンシブ対応を強化して",
    "色使いをもっと鮮やかにして",
    "フォントを大きくして読みやすくして"
  ];

  return (
    <>
      {/* エラー表示 */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">エラーが発生しました</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <span className="text-4xl">🚀</span>
                  <span>Prompty</span>
                  <span className="text-lg font-normal text-blue-600">UI Generator</span>
                </h1>
                <p className="text-gray-600 mt-2">
                  Claude Sonnet 4 で最高品質のUIを瞬時に生成 • 完全なフロントエンドコード
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* バージョン履歴コントロール */}
                {versionInfo.total > 0 && (
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={goToFirstVersion}
                      disabled={currentVersionIndex === 0}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-white transition-colors"
                      title="最初のバージョン"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={undoLastChange}
                      disabled={!canUndo}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-white transition-colors"
                      title="前のバージョン"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 px-2">
                      {versionInfo.current} / {versionInfo.total}
                    </span>
                    <button
                      onClick={redoLastChange}
                      disabled={!canRedo}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-white transition-colors"
                      title="次のバージョン"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={goToLatestVersion}
                      disabled={currentVersionIndex === versionInfo.total - 1}
                      className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-md hover:bg-white transition-colors"
                      title="最新のバージョン"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      showVersionHistory
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>履歴</span>
                  </button>

                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                      showPreview
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>プレビュー</span>
                  </button>

                  {generatedUI && (
                    <button
                      onClick={handleClear}
                      className="px-3 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>クリア</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* バージョン履歴 */}
        {showVersionHistory && versionInfo.total > 0 && (
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>バージョン履歴</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {versionInfo.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      version.isCurrent
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleVersionChange(version.index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        v{version.index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        version.type === 'generated'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {version.type === 'generated' ? '新規' : '改善'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {version.prompt}
                    </p>
                    <p className="text-xs text-gray-500">
                      {version.timestamp.toLocaleString('ja-JP')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* プロンプト入力エリア */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* メインプロンプト入力 */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">
                    {generatedUI ? 'UIを改善' : 'UIを生成'}
                  </h2>
                </div>
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    generatedUI
                      ? "例: もっとモダンなデザインにして、アニメーションを追加して"
                      : "例: ログイン画面を作って。メールとパスワード欄付きで。"
                  }
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                />
                
                <div className="flex items-center space-x-3 mt-4">
                  {!generatedUI ? (
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2 shadow-lg"
                    >
                      <Wand2 className="w-5 h-5" />
                      <span>{isGenerating ? '生成中...' : '✨ UIを生成'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleImprove}
                      disabled={!prompt.trim() || isGenerating}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-2 shadow-lg"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>{isGenerating ? '改善中...' : '🔧 UIを改善'}</span>
                    </button>
                  )}
                  
                  {generatedUI && (
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>新規生成</span>
                    </button>
                  )}
                </div>
              </div>

              {/* サンプルプロンプト */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  💡 {generatedUI ? '改善例' : 'サンプルプロンプト'}
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(generatedUI ? improvementExamples : examplePrompts).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptExample(example)}
                      className="w-full text-left p-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>🚀 Promptyコード生成の特徴</span>
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• プロレベルのWebUIを数秒で生成</li>
                <li>• <strong>iterative改善</strong>: 既存コードをベースに段階的に改良</li>
                <li>• 完全な履歴管理とUndo/Redo機能で安心して試行錯誤</li>
                <li>• リアルタイムプレビューで即座に動作確認</li>
                <li>• 高品質なコード生成</li>
              </ul>
            </div>
          </div>

          {/* コード表示とプレビューエリア */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* 左側: コード表示（タイピングアニメーション） */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span>💻</span>
                  <span>生成されたコード</span>
                  {versionInfo.total > 0 && (
                    <span className="text-sm text-gray-500">
                      (v{versionInfo.current}/{versionInfo.total})
                    </span>
                  )}
                </h2>
              </div>
              <TypingCodeDisplay
                html={generatedUI?.html || ''}
                css={generatedUI?.css || ''}
                js={generatedUI?.js || ''}
                isGenerating={isGenerating}
                onComplete={handleTypingComplete}
              />
            </div>

            {/* 右側: UIプレビュー */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span>👀</span>
                  <span>リアルタイムプレビュー</span>
                  {versionInfo.total > 0 && (
                    <span className="text-sm text-gray-500">
                      (v{versionInfo.current}/{versionInfo.total})
                    </span>
                  )}
                </h2>
              </div>
              <UIPreview
                html={generatedUI?.html || ''}
                css={generatedUI?.css || ''}
                js={generatedUI?.js || ''}
                isGenerating={isGenerating}
                showPreview={showPreview}
              />
            </div>
          </div>

          {/* 生成されたUIの説明 */}
          {generatedUI?.description && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📝 生成されたUIについて</h3>
              <p className="text-gray-700">
                {generatedUI?.description}
              </p>
              
              {/* バージョン情報 */}
              {versionInfo.total > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>バージョン履歴</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>現在:</strong> v{versionInfo.current} / {versionInfo.total}</p>
                      <p><strong>タイプ:</strong> {
                        versionHistory[currentVersionIndex]?.type === 'generated' ? '新規生成' : '改善版'
                      }</p>
                    </div>
                    <div>
                      <p><strong>作成時刻:</strong> {
                        versionHistory[currentVersionIndex]?.timestamp.toLocaleString('ja-JP')
                      }</p>
                      <p><strong>改善可能:</strong> {canRedo ? 'より新しいバージョンあり' : '最新版'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CodeGeneratorPage; 
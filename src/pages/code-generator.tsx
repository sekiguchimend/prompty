import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Send, Sparkles, AlertCircle, X, RotateCcw, Edit3, History } from 'lucide-react';
import { useUIGenerator } from '@/src/hooks/useUIGenerator';
import TypingCodeDisplay from '@/src/components/code-generator/TypingCodeDisplay';
import UIPreview from '@/src/components/code-generator/UIPreview';

const CodeGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [improvementPrompt, setImprovementPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const { 
    isGenerating, 
    generatedUI, 
    error, 
    canUndo, 
    previousVersions,
    generateUI, 
    improveUI,
    undoLastChange,
    clearError 
  } = useUIGenerator();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    try {
      setShowPreview(false);
      await generateUI(prompt);
    } catch (error) {
      // エラーはuseUIGeneratorで処理済み
    }
  };

  const handleImprovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!improvementPrompt.trim() || isGenerating) return;

    try {
      setShowPreview(false);
      await improveUI(improvementPrompt);
      setImprovementPrompt(''); // 成功時はクリア
      // 改善完了後、少し待ってからプレビューを表示
      setTimeout(() => {
        setShowPreview(true);
      }, 100);
    } catch (error) {
      // エラー時もプレビューを表示（前のバージョンが復元されるため）
      setShowPreview(true);
    }
  };

  const handleUndo = () => {
    const success = undoLastChange();
    if (success) {
      setShowPreview(true); // アンドゥ後即座にプレビュー表示
    }
  };

  const handleTypingComplete = () => {
    // タイピングアニメーション完了後にプレビューを表示
    setShowPreview(true);
  };

  // UIが既に生成済みでプレビューが非表示の場合、表示する
  useEffect(() => {
    if (generatedUI && !isGenerating && !showPreview) {
      setTimeout(() => {
        setShowPreview(true);
      }, 200);
    }
  }, [generatedUI, isGenerating, showPreview]);

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
      <Head>
        <title>UI ジェネレーター - Claude AI | Prompty</title>
        <meta name="description" content="Claude AIを使って自然言語でUIを生成。iterativeな改善とリアルタイムプレビュー。" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">UI ジェネレーター</h1>
                  <p className="text-sm text-gray-600">Claude Sonnet 4 で自然言語からUIを生成 & 改善</p>
                </div>
              </div>
              
              {/* アンドゥボタン */}
              {canUndo && (
                <button
                  onClick={handleUndo}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={isGenerating}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>元に戻す</span>
                  <span className="text-xs bg-gray-300 px-2 py-1 rounded-full">
                    {previousVersions.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* プロンプト入力エリア */}
          <div className="mb-6 space-y-4">
            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 新規UI生成 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <label htmlFor="prompt" className="block text-lg font-semibold text-gray-900 mb-3">
                  💬 どんなUIを作りたいですか？
                </label>
                
                <div className="space-y-4">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例: ログイン画面を作って。メールとパスワード欄付きで。"
                    className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isGenerating}
                  />
                  
                  {/* サンプルプロンプト */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">💡 例:</p>
                    <div className="flex flex-wrap gap-2">
                      {examplePrompts.map((example, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPrompt(example)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                          disabled={isGenerating}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Claude が生成中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>新しいUIを生成</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* UI改善フォーム */}
            {generatedUI && (
              <form onSubmit={handleImprovement} className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                  <label htmlFor="improvementPrompt" className="block text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-green-600" />
                    <span>🔄 UIを改善・修正する</span>
                  </label>
                  
                  <div className="space-y-4">
                    <textarea
                      id="improvementPrompt"
                      value={improvementPrompt}
                      onChange={(e) => setImprovementPrompt(e.target.value)}
                      placeholder="例: もっとモダンなデザインにして、ダークモードに対応させて"
                      className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      disabled={isGenerating}
                    />
                    
                    {/* 改善例 */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">🔧 改善例:</p>
                      <div className="flex flex-wrap gap-2">
                        {improvementExamples.map((example, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setImprovementPrompt(example)}
                            className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition-colors"
                            disabled={isGenerating}
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        disabled={!improvementPrompt.trim() || isGenerating}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>改善中...</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4" />
                            <span>改善を適用</span>
                          </>
                        )}
                      </button>

                      {/* 履歴表示 */}
                      {previousVersions.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <History className="w-4 h-4" />
                          <span>改善履歴: {previousVersions.length}回</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Claude Sonnet 4の特徴説明 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">🚀 Claude Sonnet 4 コード生成の特徴</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Claude Sonnet 4 でプロレベルのWebアプリを数秒で生成</li>
                <li>• <strong>iterative改善</strong>: 既存コードをベースに段階的に改良</li>
                <li>• 履歴管理とアンドゥ機能で安心して試行錯誤</li>
                <li>• リアルタイムプレビューで即座に動作確認</li>
                <li>• v0、Lovableを超える高品質なコード生成</li>
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
              <h3 className="font-semibold text-gray-900 mb-3">📝 生成されたUI について</h3>
              <p className="text-gray-700">{generatedUI.description}</p>
              
              {/* 改善履歴 */}
              {previousVersions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                    <History className="w-4 h-4" />
                    <span>改善履歴 ({previousVersions.length}回)</span>
                  </h4>
                  <p className="text-sm text-gray-600">
                    このUIは{previousVersions.length}回の改善を経て現在の状態になりました。
                    「元に戻す」ボタンで前のバージョンに戻すことができます。
                  </p>
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
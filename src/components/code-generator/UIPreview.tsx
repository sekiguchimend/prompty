import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Eye } from 'lucide-react';

interface UIPreviewProps {
  html?: string;
  css?: string;
  js?: string;
  isGenerating: boolean;
  showPreview: boolean;
}

const UIPreview: React.FC<UIPreviewProps> = ({
  html = '',
  css = '',
  js = '',
  isGenerating,
  showPreview
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIFrameContent = () => {
    if (!html && !css && !js) return '';
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        try {
            ${js}
        } catch (error) {
            console.error('JavaScript execution error:', error);
        }
    </script>
</body>
</html>`;
  };

  const updatePreview = (force = false) => {
    const content = generateIFrameContent();
    
    if (!content) {
      setError('プレビューするコンテンツがありません');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (doc) {
          doc.open();
          doc.write(content);
          doc.close();
          
          console.log('✅ Preview updated successfully');
          
          // ロード完了を待つ
          iframe.onload = () => {
            setIsLoading(false);
          };
          
          // タイムアウト処理
          setTimeout(() => {
            setIsLoading(false);
          }, 2000);
        } else {
          throw new Error('iframeドキュメントにアクセスできません');
        }
      }
    } catch (err) {
      console.error('❌ Preview update error:', err);
      setError(err instanceof Error ? err.message : 'プレビューの更新に失敗しました');
      setIsLoading(false);
    }
  };

  // コンテンツが変更されたときにプレビューを更新
  useEffect(() => {
    if (showPreview && (html || css || js)) {
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [html, css, js, showPreview]);

  // ナビゲーションメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigate') {
        console.log('Navigation message received:', event.data.page);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const refreshPreview = () => {
    console.log('🔄 Manual refresh triggered');
    updatePreview(true);
  };

  const openInNewTab = () => {
    const content = generateIFrameContent();
    if (content) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(content);
        newWindow.document.close();
      }
    }
  };

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            UIのプレビューを準備中...
          </p>
          <p className="text-sm text-gray-500 mt-2">Claude Sonnet 4 で生成中</p>
        </div>
      </div>
    );
  }

  if (!showPreview || (!html && !css && !js)) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">👀</div>
          <p className="text-lg text-gray-700">
            UIプレビュー
          </p>
          <p className="text-sm text-gray-500 mt-2">
            UIが生成されると、こちらにプレビューが表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-gray-50 border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">UIプレビュー</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshPreview}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="プレビューを更新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openInNewTab}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="新しいタブで開く"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* プレビューエリア */}
      <div className="flex-1 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">プレビューを読み込み中...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-center p-4">
              <div className="text-red-500 text-2xl mb-2">⚠️</div>
              <p className="text-red-700 font-medium">プレビューエラー</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={refreshPreview}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="UI Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* フッター */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{html.length + css.length + js.length} 文字</span>
            <span>1 ページ</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✓ プレビュー表示中</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIPreview; 
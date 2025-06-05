import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface UIPreviewProps {
  html: string;
  css: string;
  js: string;
  isGenerating: boolean;
  showPreview: boolean;
}

const UIPreview: React.FC<UIPreviewProps> = ({
  html,
  css,
  js,
  isGenerating,
  showPreview
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFullHTML = (htmlContent: string, cssContent: string, jsContent: string) => {
    // HTMLが完全なドキュメントかチェック
    const isFullDocument = htmlContent.includes('<!DOCTYPE') && htmlContent.includes('<html');
    
    if (isFullDocument) {
      // 既存のHTMLにCSS/JSを注入
      let processedHTML = htmlContent;
      
      // CSSを注入（headタグ内）
      if (cssContent.trim()) {
        const cssTag = `<style>\n${cssContent}\n</style>`;
        if (processedHTML.includes('</head>')) {
          processedHTML = processedHTML.replace('</head>', `${cssTag}\n</head>`);
        } else {
          processedHTML = processedHTML.replace('<body', `<head>${cssTag}</head>\n<body`);
        }
      }
      
      // JSを注入（bodyタグの終了前）
      if (jsContent.trim()) {
        const jsTag = `<script>\n${jsContent}\n</script>`;
        if (processedHTML.includes('</body>')) {
          processedHTML = processedHTML.replace('</body>', `${jsTag}\n</body>`);
        } else {
          processedHTML += `\n${jsTag}`;
        }
      }
      
      return processedHTML;
    } else {
      // HTMLフラグメントの場合、完全なドキュメントを作成
      return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsContent}
    </script>
</body>
</html>`;
    }
  };

  const updatePreview = async () => {
    if (!html) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fullHTML = createFullHTML(html, css, js);
      const iframe = iframeRef.current;
      
      if (iframe) {
        // iframeのコンテンツを更新
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(fullHTML);
          doc.close();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プレビューの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    if (!html) return;
    
    const fullHTML = createFullHTML(html, css, js);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    window.open(url, '_blank');
    
    // メモリリークを防ぐため、少し後にURLを解放
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    if (html) {
      // htmlがある場合は即座にプレビューを更新（showPreview条件を緩和）
      const timer = setTimeout(updatePreview, 100);
      return () => clearTimeout(timer);
    }
  }, [html, css, js]);

  // showPreviewに依存する更新も追加
  useEffect(() => {
    if (showPreview && html) {
      updatePreview();
    }
  }, [showPreview]);

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">プレビュー準備中...</p>
          <p className="text-sm text-gray-500 mt-2">コード生成完了後に表示されます</p>
        </div>
      </div>
    );
  }

  if (!showPreview || !html) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">👀</div>
          <p className="text-lg text-gray-700">UIプレビューがここに表示されます</p>
          <p className="text-sm text-gray-500 mt-2">コード生成が完了すると、即座にプレビューが表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* プレビューコントロール */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-600 ml-4">UIプレビュー</span>
          {isLoading && (
            <div className="animate-spin w-4 h-4 border-b-2 border-blue-500 rounded-full"></div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="リフレッシュ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="新しいタブで開く"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* iframeプレビュー */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="UI Preview"
          sandbox="allow-scripts allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-same-origin"
          onLoad={() => setIsLoading(false)}
          onError={() => setError('プレビューの読み込みに失敗しました')}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* ステータス */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-600">
        {error ? (
          <span className="text-red-600">❌ エラーが発生しました</span>
        ) : isLoading ? (
          <span className="text-blue-600">🔄 読み込み中...</span>
        ) : (
          <span className="text-green-600">✅ プレビュー表示中</span>
        )}
      </div>
    </div>
  );
};

export default UIPreview; 
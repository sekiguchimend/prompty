import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Copy, Check } from 'lucide-react';

interface TypingCodeDisplayProps {
  html?: string;
  css?: string;
  js?: string;
  isGenerating: boolean;
  onComplete?: () => void;
}

const TypingCodeDisplay: React.FC<TypingCodeDisplayProps> = ({
  html = '',
  css = '',
  js = '',
  isGenerating,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState<string>('html');
  const [displayedContent, setDisplayedContent] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRef = useRef<number>();

  // タイピングアニメーション用のコンテンツを取得
  const getCurrentContent = () => {
    switch (activeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'js': return js;
      default: return '';
    }
  };

  // タイピングアニメーション
  useEffect(() => {
    if (isGenerating) return;

    const content = getCurrentContent();
    if (!content || isCompleted) return;

    const animate = () => {
      setCurrentIndex(prev => {
        const newIndex = Math.min(prev + 3, content.length);
        
        setDisplayedContent(prevDisplayed => ({
          ...prevDisplayed,
          [activeTab]: content.substring(0, newIndex)
        }));

        if (newIndex >= content.length) {
          setIsCompleted(true);
          if (onComplete) {
            onComplete();
          }
          return newIndex;
        }

        return newIndex;
      });
    };

    const timeoutId = setTimeout(animate, 10);
    animationRef.current = requestAnimationFrame(() => {
      setTimeout(animate, 10);
    });

    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeTab, isGenerating, isCompleted, getCurrentContent(), onComplete]);

  // コンテンツが変更されたときにリセット
  useEffect(() => {
    if (!isGenerating && (html || css || js)) {
      setDisplayedContent({});
      setIsCompleted(false);
      setCurrentIndex(0);
    }
  }, [html, css, js, isGenerating]);

  // アクティブタブが変更されたときの処理
  useEffect(() => {
    const content = getCurrentContent();
    if (content && !displayedContent[activeTab]) {
      setCurrentIndex(0);
      setIsCompleted(false);
    }
  }, [activeTab]);

  // コピー機能
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  
  const copyToClipboard = async (content: string, tabName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedTab(tabName);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  // ダウンロード機能
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    if (html) downloadFile(html, 'index.html');
    if (css) downloadFile(css, 'styles.css');
    if (js) downloadFile(js, 'script.js');
  };

  // タブリストを生成
  const getTabs = () => {
    return [
      { key: 'html', label: 'HTML', type: 'html', color: 'text-orange-600 bg-orange-50 border-orange-200' },
      { key: 'css', label: 'CSS', type: 'css', color: 'text-blue-600 bg-blue-50 border-blue-200' },
      { key: 'js', label: 'JavaScript', type: 'js', color: 'text-green-600 bg-green-50 border-green-200' }
    ];
  };

  const tabs = getTabs();
  const currentContent = displayedContent[activeTab] || '';
  const fullContent = getCurrentContent();

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Claude Sonnet 4 でコード生成中...</p>
          <div className="text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!html && !css && !js) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">💻</div>
          <p className="text-lg text-gray-700">コード表示</p>
          <p className="text-sm text-gray-500 mt-2">
            UIが生成されると、こちらにコードが表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-gray-50 border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? `${tab.color} border`
                    : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(fullContent, activeTab)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="コードをコピー"
            >
              {copiedTab === activeTab ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={downloadAllFiles}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              title="ファイルをダウンロード"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* コードエリア */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto">
          <pre className="h-full p-4 text-sm font-mono text-gray-800 bg-gray-50 whitespace-pre-wrap">
            <code className="language-markup">
              {currentContent}
              {!isCompleted && (
                <span className="animate-pulse bg-blue-500 text-blue-500 ml-1">|</span>
              )}
            </code>
          </pre>
        </div>
      </div>

      {/* フッター */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{fullContent.length} 文字</span>
            <span>{fullContent.split('\n').length} 行</span>
            <span className="capitalize">{activeTab}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted ? (
              <span className="text-green-600">✓ 表示完了</span>
            ) : (
              <span className="text-blue-600">⌨️ タイピング中...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingCodeDisplay; 
import React, { useState, useEffect, useRef } from 'react';

// シンプルなコードハイライト表示（react-syntax-highlighterの代替）
const SimpleCodeDisplay: React.FC<{
  code: string;
  language: string;
}> = ({ code, language }) => {
  return (
    <pre className="text-sm h-full overflow-auto p-4 bg-gray-900 text-white">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
};

interface TypingCodeDisplayProps {
  html: string;
  css: string;
  js: string;
  isGenerating: boolean;
  onComplete?: () => void;
}

const TypingCodeDisplay: React.FC<TypingCodeDisplayProps> = ({
  html,
  css,
  js,
  isGenerating,
  onComplete
}) => {
  const [displayedHTML, setDisplayedHTML] = useState('');
  const [displayedCSS, setDisplayedCSS] = useState('');
  const [displayedJS, setDisplayedJS] = useState('');
  const [currentSection, setCurrentSection] = useState<'html' | 'css' | 'js' | 'complete'>('html');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  
  const typingSpeed = 1; // milliseconds per frame (極超高速)
  const charsPerFrame = 20; // 1回に表示する文字数を大幅増加
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // デバッグ用：コンテンツの検証
  useEffect(() => {
    console.log('🔍 TypingCodeDisplay content check:', {
      htmlLength: html?.length || 0,
      cssLength: css?.length || 0,
      jsLength: js?.length || 0,
      htmlPreview: html?.substring(0, 100),
      cssPreview: css?.substring(0, 100),
      jsPreview: js?.substring(0, 100)
    });
  }, [html, css, js]);

  // 新しいコンテンツが来た時にリセット
  useEffect(() => {
    if (html || css || js) {
      const isNewContent = displayedHTML !== html || displayedCSS !== css || displayedJS !== js;
      if (isNewContent && currentSection === 'complete') {
        setCurrentSection('html');
      }
    }
  }, [html, css, js, displayedHTML, displayedCSS, displayedJS, currentSection]);

  // アクティブタブが変更された時の処理
  useEffect(() => {
    // タブが変更されたら、そのタブのコンテンツが利用可能な場合は即座に表示
    switch (activeTab) {
      case 'html':
        if (html && displayedHTML !== html) {
          setDisplayedHTML(html);
        }
        break;
      case 'css':
        if (css && displayedCSS !== css) {
          setDisplayedCSS(css);
        }
        break;
      case 'js':
        if (js && displayedJS !== js) {
          setDisplayedJS(js);
          console.log('🔧 JSタブ選択時にコンテンツを即座に表示:', js.substring(0, 100));
        }
        break;
    }
  }, [activeTab, html, css, js, displayedHTML, displayedCSS, displayedJS]);

  // デバッグ用：コンテンツの検証
  useEffect(() => {
    console.log('🔍 TypingCodeDisplay content check:', {
      htmlLength: html?.length || 0,
      cssLength: css?.length || 0,
      jsLength: js?.length || 0,
      htmlPreview: html?.substring(0, 100),
      cssPreview: css?.substring(0, 100),
      jsPreview: js?.substring(0, 100),
      currentSection,
      activeTab,
      displayedJSLength: displayedJS?.length || 0
    });
  }, [html, css, js, currentSection, activeTab, displayedJS]);

  useEffect(() => {
    if (!html && !css && !js) {
      setDisplayedHTML('');
      setDisplayedCSS('');
      setDisplayedJS('');
      setCurrentSection('html');
      return;
    }

    let htmlIndex = 0;
    let cssIndex = 0;
    let jsIndex = 0;
    let animationFrameId: number;
    let isCompleted = false;
    
    const typeCode = () => {
      if (isCompleted) return;
      
      let shouldContinue = true;
      let progressMade = false;
      
      // HTMLセクション
      if (currentSection === 'html' && htmlIndex < html.length) {
        const nextIndex = Math.min(htmlIndex + charsPerFrame, html.length);
        setDisplayedHTML(html.substring(0, nextIndex));
        htmlIndex = nextIndex;
        progressMade = true;
        
        if (htmlIndex >= html.length) {
          console.log('✅ HTML typing completed, moving to CSS');
          setCurrentSection('css');
        }
      }
      // CSSセクション
      else if (currentSection === 'css' && cssIndex < css.length) {
        const nextIndex = Math.min(cssIndex + charsPerFrame, css.length);
        setDisplayedCSS(css.substring(0, nextIndex));
        cssIndex = nextIndex;
        progressMade = true;
        
        if (cssIndex >= css.length) {
          console.log('✅ CSS typing completed, moving to JS');
          setCurrentSection('js');
        }
      }
      // JSセクション
      else if (currentSection === 'js' && jsIndex < js.length) {
        const nextIndex = Math.min(jsIndex + charsPerFrame, js.length);
        setDisplayedJS(js.substring(0, nextIndex));
        jsIndex = nextIndex;
        progressMade = true;
        console.log(`📝 JS typing progress: ${jsIndex}/${js.length} chars`);
        
        if (jsIndex >= js.length) {
          console.log('✅ JS typing completed, animation finished');
          setCurrentSection('complete');
          isCompleted = true;
          shouldContinue = false;
          // onCompleteを呼ぶ前に少し待つ
          setTimeout(() => {
            onComplete?.();
          }, 100);
          return;
        }
      }
      // 全セクション完了チェック
      else if (htmlIndex >= html.length && cssIndex >= css.length && jsIndex >= js.length) {
        if (!isCompleted) {
          console.log('✅ All sections completed');
          setCurrentSection('complete');
          isCompleted = true;
          setTimeout(() => {
            onComplete?.();
          }, 100);
        }
        return;
      }
      // セクション移行の処理
      else {
        console.log(`🔄 Section transition check: currentSection=${currentSection}, html=${htmlIndex}/${html.length}, css=${cssIndex}/${css.length}, js=${jsIndex}/${js.length}`);
        
        // 強制的に次のセクションに移動（スタック防止）
        if (currentSection === 'html' && htmlIndex >= html.length && css.length > 0) {
          setCurrentSection('css');
          progressMade = true;
        } else if (currentSection === 'css' && cssIndex >= css.length && js.length > 0) {
          setCurrentSection('js');
          progressMade = true;
        } else if (currentSection === 'js' && jsIndex >= js.length) {
          setCurrentSection('complete');
          isCompleted = true;
          setTimeout(() => {
            onComplete?.();
          }, 100);
          return;
        }
      }
      
      if (shouldContinue && progressMade && !isCompleted) {
        setTimeout(() => {
          if (!isCompleted) {
            animationFrameId = requestAnimationFrame(typeCode);
          }
        }, typingSpeed);
      } else if (!progressMade && !isCompleted) {
        // プログレスがない場合は強制的に次のフレームを試行
        console.log('⚠️ No progress made, retrying...');
        setTimeout(() => {
          if (!isCompleted) {
            animationFrameId = requestAnimationFrame(typeCode);
          }
        }, typingSpeed * 10);
      }
    };

    if (html || css || js) {
      // コンテンツがすでに表示済みかチェック
      const isAlreadyDisplayed = 
        displayedHTML === html && 
        displayedCSS === css && 
        displayedJS === js;
      
      if (isAlreadyDisplayed) {
        // すでに表示済みの場合は即座にcompleteにしてonCompleteを呼ぶ
        setCurrentSection('complete');
        setTimeout(() => {
          onComplete?.();
        }, 50);
      } else {
        // 新しいコンテンツの場合はタイピングアニメーション開始
        setCurrentSection('html');
        isCompleted = false;
        animationFrameId = requestAnimationFrame(typeCode);
      }
    }

    return () => {
      isCompleted = true; // クリーンアップ時にフラグを設定
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [html, css, js]);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'html':
        // HTMLタブ: タイピング中またはアニメーション完了後のコンテンツを表示
        return currentSection === 'html' || currentSection === 'complete' ? displayedHTML : html;
      case 'css':
        // CSSタブ: タイピングでCSSまで進んでいるか、全体が完了している場合
        return (currentSection === 'css' || currentSection === 'js' || currentSection === 'complete') ? displayedCSS : css;
      case 'js':
        // JSタブ: タイピングでJSまで進んでいるか、全体が完了している場合、または直接JSタブを選択した場合
        return (currentSection === 'js' || currentSection === 'complete') ? displayedJS : js;
      default:
        return '';
    }
  };

  const getLanguage = () => {
    switch (activeTab) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      default:
        return 'html';
    }
  };

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Claude Sonnet 4 がコードを生成中...</p>
          <p className="text-sm text-gray-400 mt-2">少々お待ちください</p>
        </div>
      </div>
    );
  }

  if (!html && !css && !js) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">💻</div>
          <p className="text-lg">生成されたコードがここに表示されます</p>
          <p className="text-sm mt-2">プロンプトを入力して、UIを生成してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* タブ */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'html', label: 'HTML', icon: '🌐' },
          { key: 'css', label: 'CSS', icon: '🎨' },
          { key: 'js', label: 'JavaScript', icon: '⚡' }
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-400 bg-gray-800'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{icon}</span>
            {label}
            {/* タイピング中のインジケーター */}
            {currentSection !== 'complete' && (
              ((key === 'html' && currentSection === 'html') ||
               (key === 'css' && currentSection === 'css') ||
               (key === 'js' && currentSection === 'js'))
            ) && (
              <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
            )}
            {/* 完了インジケーター */}
            {currentSection === 'complete' && (
              <span className="ml-2 w-2 h-2 bg-blue-400 rounded-full inline-block"></span>
            )}
          </button>
        ))}
      </div>

      {/* コード表示エリア */}
      <div className="flex-1 overflow-hidden">
        <SimpleCodeDisplay
          code={getCurrentCode()}
          language={getLanguage()}
        />
      </div>

      {/* 進行状況 */}
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
        {currentSection === 'complete' ? (
          <span className="text-green-400">✅ コード生成完了</span>
        ) : (
          <span>
            📝 生成中... 
            {currentSection === 'html' && ' HTML'}
            {currentSection === 'css' && ' CSS'}
            {currentSection === 'js' && ' JavaScript'}
          </span>
        )}
      </div>
    </div>
  );
};

export default TypingCodeDisplay; 
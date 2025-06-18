'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Badge } from '@/src/components/ui/badge';
import { 
  Download, 
  Share2, 
  Code, 
  Eye, 
  Save,
  Moon,
  Sun,
  RefreshCw,
  Maximize2,
  Minimize2,
  Copy,
  Play,
  FileText,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { downloadCode, copyCode } from '@/src/lib/gemini';

export interface CodeFiles {
  [filename: string]: string;
}

export interface CodeSandboxProps {
  files: CodeFiles;
  title?: string;
  description?: string;
  framework?: string;
  language?: string;
  styling?: string;
  height?: string;
  initialTab?: 'code' | 'preview';
  onFilesChange?: (files: CodeFiles) => void;
  onSave?: (files: CodeFiles) => void;
  uiLanguage?: 'ja' | 'en';
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  files,
  title = "AI Generated App",
  description,
  framework = "react",
  language = "javascript",
  styling = "css",
  height = "400px",
  initialTab = 'preview',
  onFilesChange,
  onSave,
  uiLanguage = 'ja'
}) => {
  const [currentFiles, setCurrentFiles] = useState<CodeFiles>(files);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(initialTab);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewUrlRef = useRef<string>('');

  useEffect(() => {
    setCurrentFiles(files);
    const fileNames = Object.keys(files);
    if (fileNames.length > 0) {
      // HTMLファイルを優先的に選択
      const htmlFile = fileNames.find(name => name.endsWith('.html'));
      const jsFile = fileNames.find(name => name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx'));
      setSelectedFile(htmlFile || jsFile || fileNames[0]);
    }
    generatePreview();
  }, [files]);

  const generatePreview = async () => {
    setIsLoading(true);
    
    // 前のURLをクリーンアップ
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }


    try {
      const html = createPreviewHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      previewUrlRef.current = url;
      setPreviewUrl(url);
      
    } catch (error) {
      console.error('❌ プレビュー生成エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPreviewHTML = (): string => {
    // 全CSSファイルを結合
    const allCSS = Object.entries(currentFiles)
      .filter(([filename]) => filename.endsWith('.css'))
      .map(([_, content]) => content)
      .join('\n');

    // ReactまたはJSXファイルがある場合
    const reactFiles = Object.entries(currentFiles)
      .filter(([filename]) => filename.endsWith('.jsx') || filename.endsWith('.tsx'));

    const jsFiles = Object.entries(currentFiles)
      .filter(([filename]) => filename.endsWith('.js') && !filename.endsWith('.jsx'));

    const htmlFiles = Object.entries(currentFiles)
      .filter(([filename]) => filename.endsWith('.html'));

    // HTMLファイルがある場合はそれを使用（セキュリティ強化）
    if (htmlFiles.length > 0) {
      let html = htmlFiles[0][1];
      
      // セキュリティヘッダーを追加
      if (!html.includes('<meta http-equiv="Content-Security-Policy"')) {
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https:;">`;
        html = html.replace('<head>', `<head>\n${cspMeta}`);
      }
      
      // CSSを注入（最適化）
      if (allCSS && html.includes('<head>')) {
        const optimizedCSS = `
        /* iframe最適化スタイル */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        * { box-sizing: border-box; }
        
        /* カスタムCSS */
        ${allCSS}
        `;
        html = html.replace('<head>', `<head>\n<style>\n${optimizedCSS}\n</style>`);
      }
      
      // JSを注入（エラーハンドリング強化）
      const allJS = [...jsFiles, ...reactFiles].map(([_, content]) => content).join('\n\n');
      if (allJS && html.includes('</body>')) {
        const errorHandlingJS = `
        // グローバルエラーハンドリング
        window.addEventListener('error', function(e) {
          console.error('🚨 実行エラー:', e.error);
        });
        
        window.addEventListener('unhandledrejection', function(e) {
          console.error('🚨 Promise拒否:', e.reason);
        });
        `;
        
        const scriptTag = reactFiles.length > 0
          ? `<script>${errorHandlingJS}</script><script type="text/babel">\n${allJS}\n</script>`
          : `<script>${errorHandlingJS}\n${allJS}</script>`;
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      }
      
      return html;
    }

    // Reactアプリの場合
    if (reactFiles.length > 0) {
      return createReactHTML(reactFiles, allCSS);
    }

    // 通常のJavaScriptの場合
    if (jsFiles.length > 0) {
      return createJavaScriptHTML(jsFiles, allCSS);
    }

    // フォールバック: 美しいプロジェクト表示
    return createFallbackHTML();
  };

  const createReactHTML = (reactFiles: [string, string][], css: string): string => {
    const reactCode = reactFiles.map(([_, content]) => content).join('\n\n');
    const langAttr = uiLanguage === 'en' ? 'en' : 'ja';
    
    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https:;">
    <title>${title}</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        /* iframe最適化ベーススタイル */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        #root {
            width: 100%;
            min-height: 100vh;
            position: relative;
        }
        
        /* 美しいスクロールバー */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        ::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.3);
            border-radius: 3px;
            transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.5); }
        
        /* レスポンシブ画像 */
        img { max-width: 100%; height: auto; }
        
        /* フォーカス管理 */
        :focus { outline: 2px solid #3b82f6; outline-offset: 2px; }
        
        /* カスタムCSS */
        ${css}
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // 高度なエラーハンドリング
        window.addEventListener('error', function(e) {
            console.error('🚨 実行エラー:', e.error);
            if (e.error && e.error.stack) {
                console.error('スタックトレース:', e.error.stack);
            }
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('🚨 Promise拒否:', e.reason);
            e.preventDefault();
        });
        
        // パフォーマンス監視
        if ('performance' in window) {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                    }
                }, 0);
            });
        }
    </script>
    
    <script type="text/babel">
        ${reactCode}
        
        // 高度なコンポーネント自動マウント
        const rootElement = document.getElementById('root');
        if (rootElement) {
            try {
                // より多くのコンポーネント名パターンを検索
                const componentNames = [
                    'App', 'Component', 'Main', 'TodoApp', 'Dashboard', 'HomePage', 'LandingPage',
                    'Calculator', 'Game', 'Chat', 'Form', 'Gallery', 'Portfolio', 'Blog',
                    'Weather', 'Timer', 'Counter', 'Quiz', 'Player', 'Editor', 'Viewer'
                ];
                
                let mounted = false;
                
                // 定義されたコンポーネントを検索
                for (const name of componentNames) {
                    if (typeof window[name] !== 'undefined' && typeof window[name] === 'function') {
                        
                        const root = ReactDOM.createRoot ? ReactDOM.createRoot(rootElement) : null;
                        if (root) {
                            root.render(React.createElement(window[name]));
                        } else {
                            ReactDOM.render(React.createElement(window[name]), rootElement);
                        }
                        mounted = true;
                        break;
                    }
                }
                
                // 自動検出に失敗した場合の高度なフォールバック
                if (!mounted) {
                    
                    // グローバルスコープから React コンポーネントを検索
                    const possibleComponents = Object.keys(window).filter(key => {
                        const value = window[key];
                        return typeof value === 'function' &&
                               value.toString().includes('React') ||
                               value.toString().includes('jsx') ||
                               value.toString().includes('createElement');
                    });
                    
                    if (possibleComponents.length > 0) {
                        const componentName = possibleComponents[0];
                        
                        const root = ReactDOM.createRoot ? ReactDOM.createRoot(rootElement) : null;
                        if (root) {
                            root.render(React.createElement(window[componentName]));
                        } else {
                            ReactDOM.render(React.createElement(window[componentName]), rootElement);
                        }
                        mounted = true;
                    }
                }
                
                // 最終フォールバック
                if (!mounted) {
                    const errorComponent = React.createElement('div', {
                        style: {
                            padding: '60px 40px',
                            textAlign: 'center',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            minHeight: '100vh',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'icon',
                            style: { fontSize: '4rem', marginBottom: '20px' }
                        }, '🔍'),
                        React.createElement('h2', {
                            key: 'title',
                            style: {
                                fontSize: '1.8rem',
                                marginBottom: '20px',
                                fontWeight: '600'
                            }
                        }, 'コンポーネントが見つかりません'),
                        React.createElement('p', {
                            key: 'msg',
                            style: {
                                fontSize: '1.1rem',
                                opacity: 0.9,
                                maxWidth: '500px',
                                lineHeight: '1.6'
                            }
                        }, 'App, Component, Main などの名前でReactコンポーネントを定義してください'),
                        React.createElement('div', {
                            key: 'examples',
                            style: {
                                marginTop: '30px',
                                padding: '20px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '10px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                textAlign: 'left'
                            }
                        }, 'function App() {\\n  return <div>Hello World!</div>;\\n}')
                    ]);
                    
                    const root = ReactDOM.createRoot ? ReactDOM.createRoot(rootElement) : null;
                    if (root) {
                        root.render(errorComponent);
                    } else {
                        ReactDOM.render(errorComponent, rootElement);
                    }
                }
            } catch (error) {
                console.error('❌ レンダリングエラー:', error);
                const errorComponent = React.createElement('div', {
                    style: {
                        padding: '60px 40px',
                        textAlign: 'center',
                        color: '#dc3545',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        background: '#f8f9fa',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }
                }, [
                    React.createElement('div', {
                        key: 'icon',
                        style: { fontSize: '4rem', marginBottom: '20px' }
                    }, '⚠️'),
                    React.createElement('h2', {
                        key: 'title',
                        style: {
                            fontSize: '1.8rem',
                            marginBottom: '20px',
                            fontWeight: '600'
                        }
                    }, 'レンダリングエラー'),
                    React.createElement('p', {
                        key: 'msg',
                        style: {
                            fontSize: '1.1rem',
                            marginBottom: '15px',
                            maxWidth: '600px'
                        }
                    }, error.message),
                    React.createElement('small', {
                        key: 'hint',
                        style: {
                            color: '#6c757d',
                            fontSize: '0.9rem'
                        }
                    }, 'ブラウザのコンソールで詳細を確認してください')
                ]);
                
                const root = ReactDOM.createRoot ? ReactDOM.createRoot(rootElement) : null;
                if (root) {
                    root.render(errorComponent);
                } else {
                    ReactDOM.render(errorComponent, rootElement);
                }
            }
        }
    </script>
</body>
</html>`;
  };

  const createJavaScriptHTML = (jsFiles: [string, string][], css: string): string => {
    const jsCode = jsFiles.map(([_, content]) => content).join('\n\n');
    const langAttr = uiLanguage === 'en' ? 'en' : 'ja';
    
    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
            overflow-x: hidden;
        }
        
        /* スクロールバーのスタイリング */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        
        ${css}
    </style>
</head>
<body>
    <div id="app"></div>
    
    <script>
        try {
            ${jsCode}
        } catch (error) {
            console.error('❌ JavaScript実行エラー:', error);
            document.getElementById('app').innerHTML = \`
                <div style="padding: 40px; text-align: center; color: #dc3545; font-family: monospace; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h2 style="margin-bottom: 20px;">⚠️ JavaScript実行エラー</h2>
                    <p style="margin-bottom: 10px;">\${error.message}</p>
                    <small style="color: #6c757d;">コンソールで詳細を確認してください</small>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
  };

  const createFallbackHTML = (): string => {
    const langAttr = uiLanguage === 'en' ? 'en' : 'ja';
    
    return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:;">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 24px;
            padding: 50px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            max-width: 800px;
            width: 100%;
            animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .icon {
            font-size: 4rem;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        h1 {
            font-size: 2.8rem;
            margin-bottom: 20px;
            font-weight: 700;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .description {
            font-size: 1.3rem;
            opacity: 0.9;
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .files {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        
        .file {
            background: rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 16px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 15px;
            border-left: 4px solid #60a5fa;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .file::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s;
        }
        
        .file:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .file:hover::before {
            transform: translateX(100%);
        }
        
        .file-icon {
            font-size: 1.5rem;
            margin-right: 10px;
            vertical-align: middle;
        }
        
        .file-name {
            font-weight: 600;
            color: #e0e7ff;
        }
        
        .stats {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: #60a5fa;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-top: 5px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
                margin: 10px;
            }
            
            h1 {
                font-size: 2.2rem;
            }
            
            .description {
                font-size: 1.1rem;
            }
            
            .files {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .stats {
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📁</div>
        <h1>${title}</h1>
        <p class="description">${description || 'AI生成されたプロジェクトファイル'}</p>
        
        <div class="files">
            ${Object.keys(currentFiles).map(filename => {
                const getFileIcon = (name: string) => {
                    if (name.endsWith('.html')) return '🌐';
                    if (name.endsWith('.css')) return '🎨';
                    if (name.endsWith('.js') || name.endsWith('.jsx')) return '⚡';
                    if (name.endsWith('.ts') || name.endsWith('.tsx')) return '🔷';
                    if (name.endsWith('.json')) return '📋';
                    if (name.endsWith('.md')) return '📝';
                    return '📄';
                };
                
                return `
                    <div class="file">
                        <span class="file-icon">${getFileIcon(filename)}</span>
                        <span class="file-name">${filename}</span>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${Object.keys(currentFiles).length}</div>
                <div class="stat-label">ファイル</div>
            </div>
            <div class="stat">
                <div class="stat-number">${framework}</div>
                <div class="stat-label">フレームワーク</div>
            </div>
            <div class="stat">
                <div class="stat-number">${language}</div>
                <div class="stat-label">言語</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const handleDownload = async () => {
    try {
      await downloadCode(currentFiles, title);
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('ダウンロードに失敗しました');
    }
  };

  const handleCopyCode = async () => {
    try {
      await copyCode(currentFiles);
      alert('コードがクリップボードにコピーされました');
    } catch (error) {
      console.error('コピーエラー:', error);
      alert('コピーに失敗しました');
    }
  };

  const handleFileContentChange = (content: string | undefined) => {
    if (content !== undefined && selectedFile) {
      const newFiles = { ...currentFiles, [selectedFile]: content };
      setCurrentFiles(newFiles);
      onFilesChange?.(newFiles);
      
      // リアルタイムプレビュー更新（デバウンス）
      setTimeout(() => {
        generatePreview();
      }, 1000);
    }
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const getLanguageFromFilename = (filename: string): string => {
    if (filename.endsWith('.tsx') || filename.endsWith('.jsx')) return 'typescript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.json')) return 'json';
    return 'javascript';
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const previewDimensions = getPreviewDimensions();

  return (
    <Card className={`vscode-sandbox w-full border-0 shadow-2xl ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'} rounded-lg overflow-hidden vscode-transition`}>
      <CardHeader className={`pb-0 border-b ${theme === 'dark' ? 'border-[#2d2d30] bg-[#2d2d30]' : 'border-gray-200 bg-[#f3f3f3]'} h-12 flex items-center`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {/* VSCode-style traffic lights */}
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-[#28ca42] hover:bg-[#28ca42]/80 transition-colors cursor-pointer"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-sm font-medium ${theme === 'dark' ? 'text-[#cccccc]' : 'text-gray-700'} flex items-center gap-2`}>
                <Code className="w-4 h-4" />
                {title}
              </div>
              {description && (
                <span className={`text-xs ${theme === 'dark' ? 'text-[#858585]' : 'text-gray-500'} hidden md:inline`}>
                  — {description}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* VSCode-style badges */}
            <div className="flex gap-1 mr-3">
              <Badge variant="secondary" className={`text-xs px-2 py-1 ${theme === 'dark' ? 'bg-[#0e639c] text-white border-0' : 'bg-blue-100 text-blue-800 border-0'}`}>
                {framework}
              </Badge>
              <Badge variant="secondary" className={`text-xs px-2 py-1 ${theme === 'dark' ? 'bg-[#1a7f37] text-white border-0' : 'bg-green-100 text-green-800 border-0'}`}>
                {language}
              </Badge>
            </div>
            
            {/* VSCode-style toolbar buttons */}
            <div className="flex gap-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="テーマ切り替え"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generatePreview}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="プレビュー更新"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSave?.(currentFiles)}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="保存"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="コードをコピー"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="ダウンロード"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`h-8 w-8 p-0 rounded-md ${theme === 'dark' ? 'hover:bg-[#3c3c3c] text-[#cccccc]' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
                title="フルスクリーン"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div style={{
          height: isFullscreen ? 'calc(100vh - 80px)' : height,
          minHeight: '300px',
          maxHeight: '80vh'
        }}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'code' | 'preview')} className="h-full">
            <TabsList className={`grid w-full grid-cols-2 h-10 rounded-none border-b ${theme === 'dark' ? 'bg-[#2d2d30] border-[#3e3e42]' : 'bg-[#f3f3f3] border-gray-300'} p-0`}>
              <TabsTrigger
                value="preview"
                className={`flex items-center gap-2 text-sm rounded-none border-0 ${
                  activeTab === 'preview'
                    ? theme === 'dark'
                      ? 'bg-[#1e1e1e] text-[#cccccc] border-b-2 border-[#007acc]'
                      : 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : theme === 'dark'
                      ? 'bg-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } transition-all duration-200`}
              >
                <Eye className="w-4 h-4" />
                プレビュー
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className={`flex items-center gap-2 text-sm rounded-none border-0 ${
                  activeTab === 'code'
                    ? theme === 'dark'
                      ? 'bg-[#1e1e1e] text-[#cccccc] border-b-2 border-[#007acc]'
                      : 'bg-white text-gray-900 border-b-2 border-blue-500'
                    : theme === 'dark'
                      ? 'bg-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c]'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } transition-all duration-200`}
              >
                <Code className="w-4 h-4" />
                コード編集
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="h-full mt-0">
              <div className="h-full flex flex-col">
                {/* VSCode-style preview toolbar */}
                <div className={`flex items-center justify-center gap-1 px-3 py-2 border-b ${theme === 'dark' ? 'border-[#3e3e42] bg-[#2d2d30]' : 'border-gray-300 bg-[#f8f8f8]'}`}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                      className={`h-7 px-2 text-xs ${
                        previewMode === 'desktop'
                          ? theme === 'dark'
                            ? 'bg-[#007acc] text-white hover:bg-[#005a9e]'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : theme === 'dark'
                            ? 'text-[#cccccc] hover:bg-[#3c3c3c]'
                            : 'text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <Monitor className="w-3 h-3 mr-1" />
                      デスクトップ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewMode('tablet')}
                      className={`h-7 px-2 text-xs ${
                        previewMode === 'tablet'
                          ? theme === 'dark'
                            ? 'bg-[#007acc] text-white hover:bg-[#005a9e]'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : theme === 'dark'
                            ? 'text-[#cccccc] hover:bg-[#3c3c3c]'
                            : 'text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <Tablet className="w-3 h-3 mr-1" />
                      タブレット
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                      className={`h-7 px-2 text-xs ${
                        previewMode === 'mobile'
                          ? theme === 'dark'
                            ? 'bg-[#007acc] text-white hover:bg-[#005a9e]'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                          : theme === 'dark'
                            ? 'text-[#cccccc] hover:bg-[#3c3c3c]'
                            : 'text-gray-600 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <Smartphone className="w-3 h-3 mr-1" />
                      モバイル
                    </Button>
                  </div>
                </div>
                
                {/* Preview area with VSCode-like background */}
                <div className={`flex-1 flex items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#f5f5f5]'}`}>
                  <div
                    style={{
                      width: previewDimensions.width,
                      height: previewDimensions.height,
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                    className={`border rounded-lg overflow-hidden shadow-xl bg-white ${
                      theme === 'dark' ? 'border-[#3e3e42]' : 'border-gray-300'
                    } transition-all duration-300 hover:shadow-2xl`}
                  >
                    {isLoading ? (
                      <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#252526]' : 'bg-gray-50'}`}>
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className={`w-8 h-8 animate-spin ${theme === 'dark' ? 'text-[#007acc]' : 'text-blue-500'}`} />
                          <span className={`text-sm ${theme === 'dark' ? 'text-[#cccccc]' : 'text-gray-600'}`}>
                            プレビューを生成中...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        key={previewUrl}
                        ref={iframeRef}
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="h-full mt-0">
              <div className="flex h-full">
                {/* VSCode-style file explorer */}
                <div className={`vscode-file-tree w-64 border-r overflow-y-auto vscode-scrollbar ${theme === 'dark' ? 'bg-[#252526] border-[#3e3e42]' : 'bg-[#f3f3f3] border-gray-300'}`}>
                  {/* Explorer header */}
                  <div className={`px-3 py-2 border-b text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'border-[#3e3e42] text-[#cccccc] bg-[#2d2d30]' : 'border-gray-300 text-gray-700 bg-[#e8e8e8]'}`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      エクスプローラー
                    </div>
                  </div>
                  
                  {/* Project folder */}
                  <div className={`px-2 py-1 text-xs font-medium ${theme === 'dark' ? 'text-[#cccccc] bg-[#2d2d30]' : 'text-gray-700 bg-[#e8e8e8]'} border-b ${theme === 'dark' ? 'border-[#3e3e42]' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-xs">📁</span>
                      <span className="truncate">{title.toLowerCase().replace(/\s+/g, '-')}</span>
                      <span className={`ml-auto text-xs ${theme === 'dark' ? 'text-[#858585]' : 'text-gray-500'}`}>
                        {Object.keys(currentFiles).length}
                      </span>
                    </div>
                  </div>
                  
                  {/* File list */}
                  <div className="py-1">
                    {Object.keys(currentFiles).map((filename) => {
                      const getFileIcon = (name: string) => {
                        if (name.endsWith('.html')) return '🌐';
                        if (name.endsWith('.css')) return '🎨';
                        if (name.endsWith('.js')) return '📜';
                        if (name.endsWith('.jsx')) return '⚛️';
                        if (name.endsWith('.ts')) return '🔷';
                        if (name.endsWith('.tsx')) return '🔷';
                        if (name.endsWith('.json')) return '📋';
                        if (name.endsWith('.md')) return '📝';
                        return '📄';
                      };
                      
                      return (
                        <div
                          key={filename}
                          onClick={() => setSelectedFile(filename)}
                          className={`file-item px-3 py-1 text-sm cursor-pointer flex items-center gap-2 vscode-transition ${
                            selectedFile === filename
                              ? 'selected ' + (theme === 'dark'
                                ? 'bg-[#37373d] text-[#ffffff] border-l-2 border-[#007acc]'
                                : 'bg-[#e4e6f1] text-gray-900 border-l-2 border-blue-500')
                              : theme === 'dark'
                                ? 'text-[#cccccc] hover:bg-[#2a2d2e]'
                                : 'text-gray-700 hover:bg-gray-200'
                          }`}
                          title={filename}
                        >
                          <span className="text-xs">{getFileIcon(filename)}</span>
                          <span className="truncate font-mono text-xs">{filename}</span>
                          {selectedFile === filename && (
                            <div className={`w-1 h-1 rounded-full ml-auto ${theme === 'dark' ? 'bg-[#007acc]' : 'bg-blue-500'}`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Editor area */}
                <div className="flex-1 flex flex-col">
                  {/* Editor tab bar */}
                  {selectedFile && (
                    <div className={`flex items-center border-b ${theme === 'dark' ? 'bg-[#2d2d30] border-[#3e3e42]' : 'bg-[#f3f3f3] border-gray-300'}`}>
                      <div className={`flex items-center gap-2 px-3 py-2 text-sm border-r ${
                        theme === 'dark'
                          ? 'bg-[#1e1e1e] text-[#cccccc] border-[#3e3e42]'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}>
                        <span className="text-xs">
                          {selectedFile.endsWith('.html') ? '🌐' :
                           selectedFile.endsWith('.css') ? '🎨' :
                           selectedFile.endsWith('.js') ? '📜' :
                           selectedFile.endsWith('.jsx') ? '⚛️' :
                           selectedFile.endsWith('.ts') ? '🔷' :
                           selectedFile.endsWith('.tsx') ? '🔷' :
                           selectedFile.endsWith('.json') ? '📋' :
                           selectedFile.endsWith('.md') ? '📝' : '📄'}
                        </span>
                        <span className="font-mono text-xs">{selectedFile}</span>
                        <div className={`w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#858585]' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Monaco Editor */}
                  <div className="flex-1">
                    {selectedFile && (
                      <Editor
                        height="100%"
                        language={getLanguageFromFilename(selectedFile)}
                        value={currentFiles[selectedFile] || ''}
                        onChange={handleFileContentChange}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        options={{
                          fontSize: 14,
                          fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, Monaco, monospace',
                          lineNumbers: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                          formatOnPaste: true,
                          formatOnType: true,
                          suggestOnTriggerCharacters: true,
                          acceptSuggestionOnEnter: 'on',
                          quickSuggestions: true,
                          bracketPairColorization: { enabled: true },
                          guides: {
                            bracketPairs: true,
                            indentation: true
                          },
                          renderWhitespace: 'selection',
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          cursorSmoothCaretAnimation: 'on'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeSandbox;
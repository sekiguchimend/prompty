import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import CodeSandbox, { CodeFiles } from '@/src/components/CodeSandbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface ProjectData {
  files: CodeFiles;
  dependencies?: Record<string, string>;
  template?: string;
  title?: string;
  description?: string;
}

const SandboxPage: React.FC = () => {
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { data } = router.query;
      
      if (typeof data === 'string') {
        try {
          const decoded = atob(data);
          const parsed = JSON.parse(decoded);
          setProjectData(parsed);
        } catch (err) {
          setError('プロジェクトデータの読み込みに失敗しました');
        }
      } else {
        // デモ用のサンプルプロジェクトを設定
        setProjectData({
          title: "VSCode風 Todo アプリ",
          description: "React + TypeScript で作成されたモダンなTodoアプリケーション",
          template: "react-typescript",
          files: {
            'index.html': `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VSCode風 Todo アプリ</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="root"></div>
    <script src="script.js"></script>
</body>
</html>`,
            'styles.css': `/* VSCode風のスタイリング */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #1e1e1e;
  color: #cccccc;
  min-height: 100vh;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #2d2d30;
  border-radius: 8px;
  border-left: 4px solid #007acc;
}

.header h1 {
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 10px;
}

.header p {
  color: #858585;
  font-size: 1rem;
}

.todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #252526;
  border-radius: 8px;
  border: 1px solid #3e3e42;
}

.todo-input {
  flex: 1;
  padding: 12px;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
}

.todo-input:focus {
  outline: none;
  border-color: #007acc;
  box-shadow: 0 0 0 1px #007acc;
}

.add-btn {
  padding: 12px 20px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #005a9e;
}

.todo-list {
  background: #252526;
  border-radius: 8px;
  border: 1px solid #3e3e42;
  overflow: hidden;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #3e3e42;
  transition: background-color 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:hover {
  background: #2a2d2e;
}

.todo-checkbox {
  margin-right: 12px;
  width: 16px;
  height: 16px;
  accent-color: #007acc;
}

.todo-text {
  flex: 1;
  font-size: 14px;
  color: #cccccc;
}

.todo-text.completed {
  text-decoration: line-through;
  color: #858585;
}

.delete-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #858585;
}

.stats {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: #2d2d30;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-number {
  color: #007acc;
  font-weight: bold;
}`,
            'script.js': `// VSCode風 Todo アプリのJavaScript
class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem('todos')) || [];
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  bindEvents() {
    const form = document.getElementById('todoForm');
    const input = document.getElementById('todoInput');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        this.addTodo(text);
        input.value = '';
      }
    });
  }

  addTodo(text) {
    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.todos.unshift(todo);
    this.saveTodos();
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
    }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.render();
  }

  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  render() {
    const app = document.getElementById('root');
    const completedCount = this.todos.filter(t => t.completed).length;
    const totalCount = this.todos.length;
    const pendingCount = totalCount - completedCount;

    app.innerHTML = \`
      <div class="app">
        <div class="header">
          <h1>📝 VSCode風 Todo アプリ</h1>
          <p>効率的なタスク管理でプロダクティビティを向上</p>
        </div>

        <form id="todoForm" class="todo-form">
          <input
            type="text"
            id="todoInput"
            class="todo-input"
            placeholder="新しいタスクを入力してください..."
            autocomplete="off"
          >
          <button type="submit" class="add-btn">追加</button>
        </form>

        <div class="todo-list">
          \${this.todos.length === 0 ?
            '<div class="empty-state">📋 タスクがありません。新しいタスクを追加してください。</div>' :
            this.todos.map(todo => \`
              <div class="todo-item">
                <input
                  type="checkbox"
                  class="todo-checkbox"
                  \${todo.completed ? 'checked' : ''}
                  onchange="app.toggleTodo(\${todo.id})"
                >
                <span class="todo-text \${todo.completed ? 'completed' : ''}">\${todo.text}</span>
                <button class="delete-btn" onclick="app.deleteTodo(\${todo.id})">削除</button>
              </div>
            \`).join('')
          }
        </div>

        <div class="stats">
          <div class="stat-item">
            <span>📊 合計:</span>
            <span class="stat-number">\${totalCount}</span>
          </div>
          <div class="stat-item">
            <span>⏳ 未完了:</span>
            <span class="stat-number">\${pendingCount}</span>
          </div>
          <div class="stat-item">
            <span>✅ 完了:</span>
            <span class="stat-number">\${completedCount}</span>
          </div>
        </div>
      </div>
    \`;

    // イベントリスナーを再バインド
    this.bindEvents();
  }
}

// アプリケーションを初期化
const app = new TodoApp();

// グローバルスコープに公開（HTMLから呼び出すため）
window.app = app;`
          }
        });
      }
      
      setIsLoading(false);
    }
  }, [router.isReady, router.query]);

  const handleGoBack = () => {
    router.push('/code-generator');
  };

  const handleOpenInNewTab = () => {
    if (projectData) {
      const encoded = btoa(JSON.stringify(projectData));
      window.open(`${window.location.origin}/sandbox?data=${encoded}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <>
        <Head>
          <title>エラー - Sandbox</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">エラー</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                {error || 'プロジェクトデータが見つかりません'}
              </p>
              <Button onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                コード生成に戻る
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{projectData.title || 'Sandbox'} - Prompty</title>
        <meta name="description" content={projectData.description || 'コードサンドボックス'} />
      </Head>

      <div className="min-h-screen bg-[#1e1e1e]">
        <div className="w-full">
          {/* VSCode-style title bar */}
          <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#3c3c3c]"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    戻る
                  </Button>
                  <div className="text-sm text-[#cccccc]">
                    {projectData.title || 'コードサンドボックス'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {projectData.template && (
                  <Badge variant="secondary" className="bg-[#0e639c] text-white border-0 text-xs">
                    {projectData.template}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#3c3c3c]"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  新しいタブ
                </Button>
              </div>
            </div>
          </div>

          {/* コードサンドボックス */}
          <div className="w-full h-[calc(100vh-48px)]">
            <CodeSandbox
              files={projectData.files}
              title={projectData.title}
              description={projectData.description}
              framework={projectData.template || "vanilla"}
              language="javascript"
              styling="css"
              height="100%"
              initialTab="preview"
              uiLanguage="ja"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SandboxPage; 
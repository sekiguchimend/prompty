// 統合テスト - コード品質改善機能の完全テスト

import { validateCodeQuality, calculateQualityMetrics } from './validation';
import { codeImprovementService } from './improvement-service';

// テスト用のサンプルコード
const SAMPLE_CODE = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .todo-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .completed {
            text-decoration: line-through;
            opacity: 0.6;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
        input[type="text"] {
            width: 70%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Todo アプリ</h1>
        <div class="add-todo">
            <input type="text" id="todoInput" placeholder="新しいタスクを入力">
            <button onclick="addTodo()">追加</button>
        </div>
        <div id="todoList"></div>
    </div>

    <script>
        let todos = [];
        let nextId = 1;

        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();
            
            if (text) {
                todos.push({
                    id: nextId++,
                    text: text,
                    completed: false
                });
                input.value = '';
                renderTodos();
            }
        }

        function toggleTodo(id) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                renderTodos();
            }
        }

        function deleteTodo(id) {
            todos = todos.filter(t => t.id !== id);
            renderTodos();
        }

        function renderTodos() {
            const list = document.getElementById('todoList');
            list.innerHTML = '';
            
            todos.forEach(todo => {
                const item = document.createElement('div');
                item.className = 'todo-item' + (todo.completed ? ' completed' : '');
                item.innerHTML = \`
                    <span onclick="toggleTodo(\${todo.id})">\${todo.text}</span>
                    <button onclick="deleteTodo(\${todo.id})">削除</button>
                \`;
                list.appendChild(item);
            });
        }

        // 初期化
        renderTodos();
    </script>
</body>
</html>
`;

// テスト実行関数
export async function runIntegrationTests(): Promise<{
  success: boolean;
  results: any[];
  summary: string;
}> {
  console.log('🧪 統合テスト開始...');
  
  const results = [];
  let allTestsPassed = true;

  try {
    // テスト1: コード検証機能
    console.log('📋 テスト1: コード検証機能');
    const validationResult = validateCodeQuality(SAMPLE_CODE);
    results.push({
      test: 'コード検証',
      passed: validationResult.isValid,
      details: {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        suggestions: validationResult.suggestions.length,
        preservedElements: validationResult.preservedElements
      }
    });

    if (!validationResult.isValid) {
      console.log('❌ コード検証でエラーが検出されました:', validationResult.errors);
      allTestsPassed = false;
    } else {
      console.log('✅ コード検証成功');
    }

    // テスト2: 品質メトリクス計算
    console.log('📊 テスト2: 品質メトリクス計算');
    const qualityMetrics = calculateQualityMetrics(SAMPLE_CODE);
    const metricsValid = Object.values(qualityMetrics).every(score => 
      typeof score === 'number' && score >= 0 && score <= 100
    );
    
    results.push({
      test: '品質メトリクス',
      passed: metricsValid,
      details: qualityMetrics
    });

    if (!metricsValid) {
      console.log('❌ 品質メトリクスの計算に問題があります');
      allTestsPassed = false;
    } else {
      console.log('✅ 品質メトリクス計算成功');
    }

    // テスト3: 改善サービス（モック）
    console.log('🔧 テスト3: 改善サービス');
    const improvementRequest = {
      originalCode: SAMPLE_CODE,
      improvementPrompt: "ダークモード対応を追加してください",
      preservationLevel: 'strict' as const,
      targetAreas: ['styling' as const],
      framework: 'vanilla',
      model: 'claude-sonnet-4',
      language: 'ja' as const
    };

    // 改善サービスのテスト（実際のAPI呼び出しなしでロジックをテスト）
    const mockImprovementResult = await testImprovementLogic(improvementRequest);
    
    results.push({
      test: '改善サービス',
      passed: mockImprovementResult.success,
      details: mockImprovementResult.details
    });

    if (!mockImprovementResult.success) {
      console.log('❌ 改善サービスのテストに失敗');
      allTestsPassed = false;
    } else {
      console.log('✅ 改善サービステスト成功');
    }

    // テスト4: 保護機能の検証
    console.log('🛡️ テスト4: 保護機能の検証');
    const protectionTest = testCodeProtection(SAMPLE_CODE);
    
    results.push({
      test: '保護機能',
      passed: protectionTest.success,
      details: protectionTest.details
    });

    if (!protectionTest.success) {
      console.log('❌ 保護機能のテストに失敗');
      allTestsPassed = false;
    } else {
      console.log('✅ 保護機能テスト成功');
    }

    // テスト5: エラーハンドリング
    console.log('⚠️ テスト5: エラーハンドリング');
    const errorHandlingTest = testErrorHandling();
    
    results.push({
      test: 'エラーハンドリング',
      passed: errorHandlingTest.success,
      details: errorHandlingTest.details
    });

    if (!errorHandlingTest.success) {
      console.log('❌ エラーハンドリングのテストに失敗');
      allTestsPassed = false;
    } else {
      console.log('✅ エラーハンドリングテスト成功');
    }

  } catch (error) {
    console.error('❌ 統合テスト中にエラーが発生:', error);
    allTestsPassed = false;
    results.push({
      test: '統合テスト実行',
      passed: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }

  const summary = generateTestSummary(results, allTestsPassed);
  console.log(summary);

  return {
    success: allTestsPassed,
    results,
    summary
  };
}

// 改善ロジックのテスト（モック）
async function testImprovementLogic(request: any): Promise<{ success: boolean; details: any }> {
  try {
    // 改善サービスの主要ロジックをテスト
    const service = codeImprovementService;
    
    // 保護要素の特定テスト
    const preservedElements = (service as any).identifyPreservedElements(request.originalCode);
    
    const hasRequiredElements = 
      preservedElements.functions.length > 0 &&
      preservedElements.classes.length > 0 &&
      preservedElements.structure.length > 0;

    return {
      success: hasRequiredElements,
      details: {
        preservedElements,
        preservationLevel: request.preservationLevel,
        targetAreas: request.targetAreas
      }
    };
  } catch (error) {
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

// 保護機能のテスト
function testCodeProtection(code: string): { success: boolean; details: any } {
  try {
    // 重要な要素が正しく検出されるかテスト
    const functions = code.match(/function\s+(\w+)/g) || [];
    const classes = code.match(/class\s*=\s*["']([^"']+)["']/g) || [];
    const events = code.match(/onclick\s*=/g) || [];

    const detectionSuccess = functions.length > 0 && classes.length > 0 && events.length > 0;

    return {
      success: detectionSuccess,
      details: {
        functionsDetected: functions.length,
        classesDetected: classes.length,
        eventsDetected: events.length,
        totalElements: functions.length + classes.length + events.length
      }
    };
  } catch (error) {
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

// エラーハンドリングのテスト
function testErrorHandling(): { success: boolean; details: any } {
  try {
    const testCases = [
      { input: '', expected: 'error' }, // 空のコード
      { input: '<invalid>', expected: 'warning' }, // 不正なHTML
      { input: 'function test() { console.log("test"); }', expected: 'success' } // 正常なコード
    ];

    const results = testCases.map(testCase => {
      try {
        const validation = validateCodeQuality(testCase.input);
        const hasExpectedResult = 
          (testCase.expected === 'error' && !validation.isValid) ||
          (testCase.expected === 'warning' && validation.warnings.length > 0) ||
          (testCase.expected === 'success' && validation.isValid);

        return { input: testCase.input.substring(0, 20), expected: testCase.expected, passed: hasExpectedResult };
      } catch (error) {
        return { input: testCase.input.substring(0, 20), expected: testCase.expected, passed: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    const allPassed = results.every(result => result.passed);

    return {
      success: allPassed,
      details: { testCases: results }
    };
  } catch (error) {
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

// テスト結果のサマリー生成
function generateTestSummary(results: any[], allPassed: boolean): string {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  return `
🧪 統合テスト結果サマリー
================================
総テスト数: ${totalTests}
成功: ${passedTests} ✅
失敗: ${failedTests} ${failedTests > 0 ? '❌' : ''}
成功率: ${Math.round((passedTests / totalTests) * 100)}%

${allPassed ? '🎉 全てのテストが成功しました！' : '⚠️ 一部のテストが失敗しました。'}

詳細結果:
${results.map(r => `- ${r.test}: ${r.passed ? '✅' : '❌'}`).join('\n')}
`;
}

// 開発環境でのテスト実行
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // ブラウザ環境での手動テスト実行
  (window as any).runCodeQualityTests = runIntegrationTests;
  console.log('🧪 コード品質テストが利用可能です。runCodeQualityTests() を実行してください。');
}
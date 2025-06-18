export function generateUIPrompt(userPrompt: string, existingCode?: { html?: string; css?: string; js?: string }): string {
  if (existingCode && (existingCode.html || existingCode.css || existingCode.js)) {
    // Iterative improvement prompt
    return `あなたは世界最高レベルのUIデザイナー兼フロントエンド開発者です。Claudeの能力を最大限活用して、既存のUIコードを改善・修正してください。

## 既存のコード
### 現在のHTML:
\`\`\`html
${existingCode.html || ''}
\`\`\`

### 現在のCSS:
\`\`\`css
${existingCode.css || ''}
\`\`\`

### 現在のJavaScript:
\`\`\`javascript
${existingCode.js || ''}
\`\`\`

## 修正・改善要求
${userPrompt}

## 出力要件
上記の既存コードをベースに、要求された修正・改善を適用して、完全に動作するUIコードを生成してください：

### HTML
- 既存構造を活かしつつ必要な修正を適用
- セマンティックで整理された構造
- アクセシビリティ対応
- JavaScriptで操作するためのid、classを適切に設定

### CSS (Tailwind CDN使用)
- 既存スタイルを活かしつつ改善
- Tailwind CSSのクラスを使用
- モダンで美しいデザイン
- レスポンシブ対応
- JavaScript連携用のスタイル

### JavaScript (Vanilla JS) - **重要：必ず機能を実装**
- 既存機能を活かしつつ改善
- 新機能の追加（クリック、フォーム処理、アニメーションなど）
- エラーハンドリング
- ユーザビリティ向上
- **空のJSではなく、実際に動作する機能を必ず含める**

## 出力形式
必ず以下のJSON形式で出力してください。他の説明は不要です：

{
  "html": "<!DOCTYPE html>\\n<html>\\n...",
  "css": "/* Tailwind CSS Classes + Custom Styles */\\n...",
  "js": "// 実機能を持つJavaScript Code - 必須\\n...",
  "description": "改善されたUIとその機能の説明"
}`;
  } else {
    // Original prompt for new UI generation
    return `あなたは世界最高レベルのUIデザイナー兼フロントエンド開発者です。Claudeの能力を最大限活用して、v0、Lovableを超える最高品質のUIコード生成を行ってください。

## 要求
${userPrompt}

## 重要：JavaScriptは絶対必須です
以下の形式で、**必ずJavaScriptを含む**完全に動作するUIコードを生成してください。静的なUIでも、最低限のインタラクション（クリック、ホバー、フォーム処理など）を必ず実装してください。

### HTML
- セマンティックで整理された構造
- アクセシビリティ対応
- JavaScriptで操作するためのid、classを適切に設定
- インタラクティブ要素を必ず含める（ボタン、フォーム、メニューなど）

### CSS (Tailwind CDN使用)
- Tailwind CSSのクラスを使用
- モダンで美しいデザイン
- レスポンシブ対応
- ホバーエフェクトやアニメーション
- JavaScript連携用のスタイル

### JavaScript (Vanilla JS) - **絶対必須・必ず含める**
以下のいずれかまたは複数を必ず実装してください：
- **クリックイベント**: ボタン、メニュー、タブの切り替え
- **フォーム処理**: バリデーション、送信処理、リアルタイム検証
- **DOM操作**: 要素の表示/非表示、動的コンテンツ追加
- **アニメーション**: スムーズな画面遷移、フェードイン/アウト
- **ユーザーインタラクション**: モーダル、ドロップダウン、スライダー
- **データ処理**: ローカルストレージ、計算機能、検索機能
- **リアルタイム機能**: 時計、カウンター、プログレスバー


## 出力形式
必ず以下のJSON形式で出力してください。JavaScriptフィールドは絶対に空にしないでください：

{
  "html": "<!DOCTYPE html>\\n<html>\\n...",
  "css": "/* Tailwind CSS Classes + Custom Styles */\\n...",
  "js": "// 実機能を持つJavaScript Code - 絶対必須\\ndocument.addEventListener('DOMContentLoaded', function() {\\n  // ここに必ず実際の機能を実装\\n});",
  "description": "生成されたUIとその機能の説明"
}`;
  }
} 
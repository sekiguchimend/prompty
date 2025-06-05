# コード改善API修正内容

## 問題の概要
既存のコード改善APIで、「既存のスタイル（変更なし）は省略」や「既存の関数は変更せずに保持」のようなコメントを使ってコードを改善すると、既存のコードが消えてしまう問題がありました。

## 修正内容

### 1. プロンプトの強化 (`generateImprovementPrompt`)
- **既存コードの解析機能を追加**: 入力されたコードがJSON形式か単一ファイルかを自動判定
- **保護原則の明確化**: 既存コードの完全保持を厳格に指示
- **実装方針の具体化**: 追加のみ許可、置換禁止の明確な指示
- **レスポンス形式の厳格化**: 既存コードを必ず含めるよう指示

### 2. JSON解析とマージ処理の改善 (`extractAndFixJSON`)
- **既存ファイル解析**: 入力コードから既存ファイル構造を抽出
- **保持率チェック**: 既存コードの80%以上が保持されているかを検証
- **強制マージ機能**: 保持率が低い場合、既存コードを強制的に保持
- **ファイル別マージ戦略**:
  - HTML: bodyタグ内に新要素を追加
  - CSS: 既存スタイルの後に新スタイルを追加
  - JavaScript: 既存コードの後に新機能を追加

### 3. フォールバック処理の改善 (`createFallbackResponse`)
- **既存コード保持**: JSON解析に失敗した場合でも既存コードを保持
- **段階的生成**: 既存ファイルがある場合は保持し、ない場合のみ新規作成
- **保持確認**: フォールバック処理でも既存コードの完全保持を保証

## 主な改善点

### Before (修正前)
```javascript
// 既存の関数は変更せずに保持
function existingFunction() {
  // 既存のコード
}

// 新しい機能
function newFunction() {
  // 新しいコード
}
```
↓ AIが既存コードを削除してしまう

### After (修正後)
```javascript
// 既存の関数（完全保持）
function existingFunction() {
  // 既存のコード（そのまま保持）
}

// 新機能の実装
function newFunction() {
  // 新しいコード（追加）
}
```
↓ 既存コードを確実に保持し、新機能を追加

## 技術的な改善

### 1. 既存コード解析
```typescript
// 既存コードの解析を試行
let existingFiles: Record<string, string> = {};
try {
  const parsed = JSON.parse(originalCode);
  if (parsed.files && typeof parsed.files === 'object') {
    existingFiles = parsed.files;
  }
} catch {
  // JSONでない場合は、単一ファイルとして扱う
  if (originalCode.includes('<!DOCTYPE html>')) {
    existingFiles['index.html'] = originalCode;
  }
  // ... 他のファイル形式の判定
}
```

### 2. 保持率チェック
```typescript
const preservationRatio = existingKeyLines.length > 0 
  ? preservationScore / existingKeyLines.length 
  : 1;

if (preservationRatio < 0.8) {
  // 強制マージ実行
  console.log(`⚠️ ${filename}: 既存コード保持率 ${Math.round(preservationRatio * 100)}% - 強制マージ実行`);
}
```

### 3. ファイル別マージ戦略
```typescript
if (filename.endsWith('.html')) {
  // HTMLの場合、bodyタグ内に新しい要素を追加
  result.files[filename] = existingContent.replace(
    /<\/body>/i,
    `\n    <!-- 新機能追加 -->\n${newElementsMatch[1]}\n</body>`
  );
} else if (filename.endsWith('.css')) {
  // CSSの場合、既存スタイルの後に新しいスタイルを追加
  result.files[filename] = existingContent + '\n\n/* 新機能のスタイル */\n' + newContent;
} else if (filename.endsWith('.js')) {
  // JavaScriptの場合、既存コードの後に新しいコードを追加
  result.files[filename] = existingContent + '\n\n// 新機能の実装\n' + newContent;
}
```

## 使用方法

### API呼び出し例
```typescript
const response = await fetch('/api/improve-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalCode: JSON.stringify({
      files: {
        'index.html': '<!DOCTYPE html>...',
        'script.js': 'function existing() {...}',
        'styles.css': '.existing-class {...}'
      }
    }),
    improvementRequest: 'ダークモード機能を追加してください',
    framework: 'vanilla',
    model: 'gemini-2.0-flash',
    language: 'ja'
  })
});
```

### 期待される結果
- 既存のHTML構造は完全に保持
- 既存のJavaScript関数は変更されず保持
- 既存のCSSスタイルは削除されず保持
- 新機能（ダークモード）が既存コードに追加される形で実装

## 検証方法

1. **既存コード保持の確認**: 改善前後でコードの行数や主要な関数が保持されているか
2. **新機能の追加確認**: 要求された改善が適切に追加されているか
3. **動作確認**: 既存機能が正常に動作し、新機能も利用可能か

## 今後の改善予定

- [ ] より高度な既存コード解析（AST解析の導入）
- [ ] ユーザー定義の保持ルール設定
- [ ] 改善履歴の管理機能
- [ ] リアルタイムプレビュー機能

---

この修正により、コード改善時に既存のコードが消えてしまう問題が解決され、安全で確実なコード改善が可能になりました。
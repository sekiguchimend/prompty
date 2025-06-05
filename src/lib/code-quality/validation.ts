// 高品質コード生成・改善のためのバリデーション機能

export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  preservedElements: {
    functions: string[];
    classes: string[];
    events: string[];
    styles: string[];
  };
}

export interface CodeQualityMetrics {
  complexity: number;
  maintainability: number;
  readability: number;
  performance: number;
  accessibility: number;
  security: number;
}

// コードの品質を検証
export function validateCodeQuality(code: string): CodeValidationResult {
  const result: CodeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    preservedElements: {
      functions: [],
      classes: [],
      events: [],
      styles: []
    }
  };

  try {
    // 基本的な構文チェック
    validateBasicSyntax(code, result);
    
    // セキュリティチェック
    validateSecurity(code, result);
    
    // パフォーマンスチェック
    validatePerformance(code, result);
    
    // アクセシビリティチェック
    validateAccessibility(code, result);
    
    // 保護すべき要素の抽出
    extractPreservedElements(code, result);
    
  } catch (error) {
    result.isValid = false;
    result.errors.push(`バリデーションエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// 基本的な構文チェック
function validateBasicSyntax(code: string, result: CodeValidationResult): void {
  // HTML構文チェック
  if (code.includes('<html') || code.includes('<!DOCTYPE')) {
    const unclosedTags = findUnclosedTags(code);
    if (unclosedTags.length > 0) {
      result.warnings.push(`閉じられていないHTMLタグ: ${unclosedTags.join(', ')}`);
    }
  }

  // CSS構文チェック
  if (code.includes('{') && code.includes('}')) {
    const unclosedBraces = countBraces(code);
    if (unclosedBraces !== 0) {
      result.errors.push('CSSの波括弧が正しく閉じられていません');
      result.isValid = false;
    }
  }

  // JavaScript構文チェック
  if (code.includes('function') || code.includes('=>') || code.includes('const ')) {
    const jsErrors = validateJavaScript(code);
    result.errors.push(...jsErrors);
    if (jsErrors.length > 0) {
      result.isValid = false;
    }
  }
}

// セキュリティチェック
function validateSecurity(code: string, result: CodeValidationResult): void {
  const securityIssues = [
    { pattern: /eval\s*\(/g, message: 'eval()の使用は危険です' },
    { pattern: /innerHTML\s*=/g, message: 'innerHTML使用時はXSS対策を確認してください' },
    { pattern: /document\.write\s*\(/g, message: 'document.write()の使用は推奨されません' },
    { pattern: /onclick\s*=/g, message: 'インラインイベントハンドラーよりaddEventListenerを推奨' }
  ];

  securityIssues.forEach(issue => {
    if (issue.pattern.test(code)) {
      result.warnings.push(issue.message);
    }
  });
}

// パフォーマンスチェック
function validatePerformance(code: string, result: CodeValidationResult): void {
  // 大きなファイルサイズの警告
  if (code.length > 100000) {
    result.warnings.push('コードサイズが大きいです。分割を検討してください');
  }

  // 非効率なセレクターの検出
  const inefficientSelectors = [
    /\*\s*{/g, // ユニバーサルセレクター
    /\w+\s+\w+\s+\w+\s+\w+/g // 深いネスト
  ];

  inefficientSelectors.forEach(selector => {
    if (selector.test(code)) {
      result.suggestions.push('CSSセレクターの最適化を検討してください');
    }
  });
}

// アクセシビリティチェック
function validateAccessibility(code: string, result: CodeValidationResult): void {
  const a11yIssues = [
    { pattern: /<img(?![^>]*alt=)/g, message: '画像にalt属性を追加してください' },
    { pattern: /<input(?![^>]*aria-label)(?![^>]*<label)/g, message: 'フォーム要素にラベルを追加してください' },
    { pattern: /<button(?![^>]*aria-label)(?![^>]*>.*?<\/button>)/g, message: 'ボタンに説明的なテキストを追加してください' }
  ];

  a11yIssues.forEach(issue => {
    if (issue.pattern.test(code)) {
      result.suggestions.push(issue.message);
    }
  });
}

// 保護すべき要素の抽出
function extractPreservedElements(code: string, result: CodeValidationResult): void {
  // 関数の抽出
  const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*=>\s*/g);
  if (functionMatches) {
    result.preservedElements.functions = functionMatches.map(match => 
      match.replace(/function\s+|const\s+|=>\s*|\s*=\s*\(/g, '').trim()
    ).filter(name => name.length > 0);
  }

  // CSSクラスの抽出
  const cssClassMatches = code.match(/\.[\w-]+(?=\s*{)|class\s*=\s*["']([^"']+)["']/g);
  if (cssClassMatches) {
    result.preservedElements.classes = cssClassMatches.flatMap(match => {
      if (match.startsWith('.')) {
        return [match.substring(1)];
      } else {
        return match.replace(/class\s*=\s*["']|["']/g, '').split(/\s+/);
      }
    });
  }

  // イベントハンドラーの抽出
  const eventMatches = code.match(/addEventListener\s*\(\s*["'](\w+)["']|on\w+\s*=/g);
  if (eventMatches) {
    result.preservedElements.events = eventMatches.map(match => 
      match.replace(/addEventListener\s*\(\s*["']|["']|on|=/g, '').trim()
    );
  }
}

// ヘルパー関数
function findUnclosedTags(html: string): string[] {
  const tagStack: string[] = [];
  const unclosed: string[] = [];
  const tagRegex = /<\/?(\w+)[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[0].endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag);

    if (isSelfClosing) continue;

    if (isClosing) {
      if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tag) {
        tagStack.pop();
      } else {
        unclosed.push(tag);
      }
    } else {
      tagStack.push(tag);
    }
  }

  return [...unclosed, ...tagStack];
}

function countBraces(css: string): number {
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  return openBraces - closeBraces;
}

function validateJavaScript(code: string): string[] {
  const errors: string[] = [];
  
  try {
    // 基本的な構文チェック（簡易版）
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('JavaScriptの括弧が正しく閉じられていません');
    }

    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('JavaScriptの波括弧が正しく閉じられていません');
    }
  } catch (error) {
    errors.push('JavaScript構文エラーが検出されました');
  }

  return errors;
}

// コード品質メトリクスの計算
export function calculateQualityMetrics(code: string): CodeQualityMetrics {
  const validation = validateCodeQuality(code);
  
  return {
    complexity: calculateComplexity(code),
    maintainability: calculateMaintainability(code, validation),
    readability: calculateReadability(code),
    performance: calculatePerformanceScore(code),
    accessibility: calculateAccessibilityScore(code),
    security: calculateSecurityScore(code, validation)
  };
}

function calculateComplexity(code: string): number {
  const cyclomaticComplexity = (code.match(/if|else|while|for|switch|case|\?/g) || []).length;
  return Math.max(0, Math.min(100, 100 - cyclomaticComplexity * 2));
}

function calculateMaintainability(code: string, validation: CodeValidationResult): number {
  let score = 100;
  score -= validation.errors.length * 20;
  score -= validation.warnings.length * 10;
  score -= Math.max(0, code.length - 10000) / 1000; // ファイルサイズペナルティ
  return Math.max(0, Math.min(100, score));
}

function calculateReadability(code: string): number {
  const lines = code.split('\n');
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
  const commentRatio = (code.match(/\/\/|\/\*|\*\/|<!--/g) || []).length / lines.length;
  
  let score = 100;
  score -= Math.max(0, avgLineLength - 80) * 0.5; // 長い行のペナルティ
  score += commentRatio * 20; // コメントのボーナス
  
  return Math.max(0, Math.min(100, score));
}

function calculatePerformanceScore(code: string): number {
  let score = 100;
  
  // パフォーマンスに影響する要素をチェック
  if (code.includes('document.write')) score -= 20;
  if (code.includes('eval(')) score -= 30;
  if ((code.match(/for\s*\(/g) || []).length > 5) score -= 10; // 多重ループ
  
  return Math.max(0, Math.min(100, score));
}

function calculateAccessibilityScore(code: string): number {
  let score = 100;
  
  const imgTags = (code.match(/<img/g) || []).length;
  const imgWithAlt = (code.match(/<img[^>]*alt=/g) || []).length;
  if (imgTags > 0) {
    score = (imgWithAlt / imgTags) * 100;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateSecurityScore(code: string, validation: CodeValidationResult): number {
  let score = 100;
  
  const securityWarnings = validation.warnings.filter(w => 
    w.includes('eval') || w.includes('innerHTML') || w.includes('XSS')
  );
  
  score -= securityWarnings.length * 15;
  
  return Math.max(0, Math.min(100, score));
}
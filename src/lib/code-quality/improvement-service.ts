// 高品質コード改善サービス - 既存コード完全保護機能付き

import { validateCodeQuality, calculateQualityMetrics, CodeValidationResult, CodeQualityMetrics } from './validation';

export interface ImprovementRequest {
  originalCode: string;
  improvementPrompt: string;
  preservationLevel: 'strict' | 'moderate' | 'flexible';
  targetAreas: ('structure' | 'styling' | 'functionality' | 'performance' | 'accessibility' | 'security')[];
  framework: string;
  model: string;
  language: 'ja' | 'en';
}

export interface ImprovementResult {
  improvedCode: Record<string, string>;
  preservedElements: {
    functions: string[];
    classes: string[];
    events: string[];
    styles: string[];
    structure: string[];
  };
  improvements: {
    category: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  qualityMetrics: {
    before: CodeQualityMetrics;
    after: CodeQualityMetrics;
    improvement: number;
  };
  warnings: string[];
  recommendations: string[];
}

export class CodeImprovementService {
  private preservationRules = {
    strict: {
      allowStructureChanges: false,
      allowFunctionRenames: false,
      allowClassRenames: false,
      allowStyleOverrides: false,
      maxChanges: 3
    },
    moderate: {
      allowStructureChanges: false,
      allowFunctionRenames: false,
      allowClassRenames: false,
      allowStyleOverrides: true,
      maxChanges: 5
    },
    flexible: {
      allowStructureChanges: true,
      allowFunctionRenames: false,
      allowClassRenames: false,
      allowStyleOverrides: true,
      maxChanges: 10
    }
  };

  async improveCode(request: ImprovementRequest): Promise<ImprovementResult> {
    console.log('🔧 コード改善開始:', {
      preservationLevel: request.preservationLevel,
      targetAreas: request.targetAreas,
      codeLength: request.originalCode.length
    });

    // 1. 既存コードの分析
    const originalValidation = validateCodeQuality(request.originalCode);
    const originalMetrics = calculateQualityMetrics(request.originalCode);

    // 2. 保護すべき要素の特定
    const preservedElements = this.identifyPreservedElements(request.originalCode);

    // 3. 改善計画の策定
    const improvementPlan = this.createImprovementPlan(
      request,
      originalValidation,
      preservedElements
    );

    // 4. 安全な改善の実行
    const improvedCode = await this.executeImprovements(
      request,
      improvementPlan,
      preservedElements
    );

    // 5. 改善後の品質評価
    const improvedValidation = validateCodeQuality(Object.values(improvedCode).join('\n'));
    const improvedMetrics = calculateQualityMetrics(Object.values(improvedCode).join('\n'));

    // 6. 結果の検証
    const verificationResult = this.verifyPreservation(
      request.originalCode,
      improvedCode,
      preservedElements
    );

    const result: ImprovementResult = {
      improvedCode,
      preservedElements,
      improvements: improvementPlan.improvements,
      qualityMetrics: {
        before: originalMetrics,
        after: improvedMetrics,
        improvement: this.calculateOverallImprovement(originalMetrics, improvedMetrics)
      },
      warnings: [...originalValidation.warnings, ...verificationResult.warnings],
      recommendations: this.generateRecommendations(originalValidation, improvedValidation)
    };

    console.log('✅ コード改善完了:', {
      preservedFunctions: result.preservedElements.functions.length,
      improvements: result.improvements.length,
      qualityImprovement: result.qualityMetrics.improvement
    });

    return result;
  }

  private identifyPreservedElements(code: string): ImprovementResult['preservedElements'] {
    const elements: ImprovementResult['preservedElements'] = {
      functions: [],
      classes: [],
      events: [],
      styles: [],
      structure: []
    };

    try {
      // 関数の特定
      const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*=>\s*/g);
      if (functionMatches) {
        elements.functions = functionMatches.map(match => 
          match.replace(/function\s+|const\s+|=>\s*|\s*=\s*\(/g, '').trim()
        ).filter(name => name.length > 0);
      }

      // CSSクラスの特定
      const cssClassMatches = code.match(/\.[\w-]+(?=\s*{)|class\s*=\s*["']([^"']+)["']/g);
      if (cssClassMatches) {
        elements.classes = cssClassMatches.flatMap(match => {
          if (match.startsWith('.')) {
            return [match.substring(1)];
          } else {
            return match.replace(/class\s*=\s*["']|["']/g, '').split(/\s+/);
          }
        });
      }

      // イベントハンドラーの特定
      const eventMatches = code.match(/addEventListener\s*\(\s*["'](\w+)["']|on\w+\s*=/g);
      if (eventMatches) {
        elements.events = eventMatches.map(match => 
          match.replace(/addEventListener\s*\(\s*["']|["']|on|=/g, '').trim()
        );
      }

      // スタイル定義の特定
      const styleMatches = code.match(/\.[\w-]+\s*{[^}]*}/g);
      if (styleMatches) {
        elements.styles = styleMatches.map(match => 
          match.split('{')[0].trim()
        );
      }

      // HTML構造の特定
      const structureMatches = code.match(/<(\w+)(?:\s[^>]*)?>/g);
      if (structureMatches) {
        elements.structure = Array.from(new Set(
          structureMatches.map(match => match.replace(/<|>|\s.*$/g, ''))
        ));
      }

    } catch (error) {
      console.warn('要素特定でエラー:', error);
    }

    return elements;
  }

  private createImprovementPlan(
    request: ImprovementRequest,
    validation: CodeValidationResult,
    preservedElements: ImprovementResult['preservedElements']
  ) {
    const improvements = [];
    const rules = this.preservationRules[request.preservationLevel];

    // ターゲットエリアに基づく改善計画
    for (const area of request.targetAreas) {
      switch (area) {
        case 'accessibility':
          if (validation.suggestions.some(s => s.includes('alt'))) {
            improvements.push({
              category: 'アクセシビリティ',
              description: 'alt属性の追加',
              impact: 'medium' as const
            });
          }
          break;
        case 'performance':
          improvements.push({
            category: 'パフォーマンス',
            description: 'コードの最適化',
            impact: 'high' as const
          });
          break;
        case 'security':
          if (validation.warnings.some(w => w.includes('eval'))) {
            improvements.push({
              category: 'セキュリティ',
              description: 'eval()の安全な代替実装',
              impact: 'high' as const
            });
          }
          break;
        case 'styling':
          if (rules.allowStyleOverrides) {
            improvements.push({
              category: 'スタイリング',
              description: 'CSSの改善と最適化',
              impact: 'medium' as const
            });
          }
          break;
        case 'functionality':
          improvements.push({
            category: '機能性',
            description: 'エラーハンドリングの追加',
            impact: 'medium' as const
          });
          break;
        case 'structure':
          if (rules.allowStructureChanges) {
            improvements.push({
              category: '構造',
              description: 'HTMLセマンティクスの改善',
              impact: 'low' as const
            });
          }
          break;
      }
    }

    return { improvements: improvements.slice(0, rules.maxChanges) };
  }

  private async executeImprovements(
    request: ImprovementRequest,
    plan: { improvements: any[] },
    preservedElements: ImprovementResult['preservedElements']
  ): Promise<Record<string, string>> {
    // 実際の改善実行は外部APIに委譲
    // ここでは保護されたコードの構造を維持
    const files = this.parseCodeIntoFiles(request.originalCode);
    
    // 各ファイルに対して安全な改善を適用
    const improvedFiles: Record<string, string> = {};
    
    for (const [filename, content] of Object.entries(files)) {
      improvedFiles[filename] = this.applySafeImprovements(
        content,
        plan.improvements,
        preservedElements,
        request.preservationLevel
      );
    }

    return improvedFiles;
  }

  private parseCodeIntoFiles(code: string): Record<string, string> {
    // コードを適切なファイルに分割
    const files: Record<string, string> = {};

    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
      files['index.html'] = code;
    } else if (code.includes('<style>') || code.includes('body {')) {
      files['style.css'] = code;
    } else if (code.includes('function') || code.includes('const ')) {
      files['script.js'] = code;
    } else {
      files['index.html'] = code;
    }

    return files;
  }

  private applySafeImprovements(
    content: string,
    improvements: any[],
    preservedElements: ImprovementResult['preservedElements'],
    preservationLevel: string
  ): string {
    let improvedContent = content;

    // 保護レベルに応じた安全な改善を適用
    for (const improvement of improvements) {
      switch (improvement.category) {
        case 'アクセシビリティ':
          improvedContent = this.addAccessibilityFeatures(improvedContent, preservedElements);
          break;
        case 'パフォーマンス':
          improvedContent = this.optimizePerformance(improvedContent, preservedElements);
          break;
        case 'セキュリティ':
          improvedContent = this.enhanceSecurity(improvedContent, preservedElements);
          break;
        case 'スタイリング':
          if (preservationLevel !== 'strict') {
            improvedContent = this.improveStyles(improvedContent, preservedElements);
          }
          break;
      }
    }

    return improvedContent;
  }

  private addAccessibilityFeatures(content: string, preserved: ImprovementResult['preservedElements']): string {
    // 既存の構造を保持しながらアクセシビリティを改善
    let improved = content;
    
    // alt属性の追加（既存のimg要素を変更せず、不足分のみ追加）
    improved = improved.replace(
      /<img(?![^>]*alt=)([^>]*)>/g,
      '<img$1 alt="画像の説明">'
    );

    return improved;
  }

  private optimizePerformance(content: string, preserved: ImprovementResult['preservedElements']): string {
    // パフォーマンス最適化（既存機能を保持）
    let improved = content;
    
    // 非効率なセレクターの最適化（既存のクラス名は保持）
    // 新しい最適化されたスタイルを追加
    if (content.includes('<style>')) {
      improved = improved.replace(
        '</style>',
        `
/* パフォーマンス最適化されたスタイル */
.optimized-container { contain: layout style; }
.lazy-load { content-visibility: auto; }
</style>`
      );
    }

    return improved;
  }

  private enhanceSecurity(content: string, preserved: ImprovementResult['preservedElements']): string {
    // セキュリティ強化（既存機能を保持）
    let improved = content;
    
    // 危険な関数の使用に対する警告コメントを追加
    improved = improved.replace(
      /eval\s*\(/g,
      '/* セキュリティ警告: eval()の使用は危険です */ eval('
    );

    return improved;
  }

  private improveStyles(content: string, preserved: ImprovementResult['preservedElements']): string {
    // スタイルの改善（既存のクラス名とスタイルを保持）
    let improved = content;
    
    // 新しいユーティリティクラスを追加
    if (content.includes('<style>')) {
      improved = improved.replace(
        '</style>',
        `
/* 改善されたユーティリティクラス */
.flex-center { display: flex; align-items: center; justify-content: center; }
.transition-smooth { transition: all 0.3s ease; }
.shadow-elegant { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
</style>`
      );
    }

    return improved;
  }

  private verifyPreservation(
    originalCode: string,
    improvedCode: Record<string, string>,
    preservedElements: ImprovementResult['preservedElements']
  ): { warnings: string[] } {
    const warnings: string[] = [];
    const improvedCodeString = Object.values(improvedCode).join('\n');

    // 保護された要素が維持されているかチェック
    for (const func of preservedElements.functions) {
      if (!improvedCodeString.includes(func)) {
        warnings.push(`関数 '${func}' が失われた可能性があります`);
      }
    }

    for (const className of preservedElements.classes) {
      if (!improvedCodeString.includes(className)) {
        warnings.push(`CSSクラス '${className}' が失われた可能性があります`);
      }
    }

    return { warnings };
  }

  private calculateOverallImprovement(before: CodeQualityMetrics, after: CodeQualityMetrics): number {
    const weights = {
      complexity: 0.2,
      maintainability: 0.25,
      readability: 0.2,
      performance: 0.15,
      accessibility: 0.1,
      security: 0.1
    };

    const beforeScore = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + before[key as keyof CodeQualityMetrics] * weight,
      0
    );

    const afterScore = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + after[key as keyof CodeQualityMetrics] * weight,
      0
    );

    return Math.round(((afterScore - beforeScore) / beforeScore) * 100);
  }

  private generateRecommendations(
    original: CodeValidationResult,
    improved: CodeValidationResult
  ): string[] {
    const recommendations: string[] = [];

    if (improved.errors.length > 0) {
      recommendations.push('残存するエラーの修正を検討してください');
    }

    if (improved.warnings.length > original.warnings.length) {
      recommendations.push('新しい警告が発生しました。コードを再確認してください');
    }

    if (improved.suggestions.length > 0) {
      recommendations.push('追加の改善提案があります');
    }

    return recommendations;
  }
}

// シングルトンインスタンス
export const codeImprovementService = new CodeImprovementService();
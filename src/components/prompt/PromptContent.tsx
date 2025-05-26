import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { Check, Lock, FileText, Info, Eye, ExternalLink, Download } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import PurchaseDialog from './PurchaseDialog';
import Image from 'next/image';
import { trackView } from '../../lib/analytics';
import { supabase } from '../../lib/supabaseClient';
import { isContentFree, shouldShowFullContent, normalizeContentText, isContentPremium } from '../../utils/content-helpers';
import { checkPurchaseStatus } from '../../utils/purchase-helpers';
import { UnifiedAvatar } from '../index';
import PurchaseSection from './PurchaseSection';
import { useAuth } from '../../lib/auth-context';

// 重いコンポーネントを遅延読み込み（Code Splitting）
const ViewCounter = lazy(() => import('../view-counter'));

// 安全な画像URLを取得する関数
const getSafeImageUrl = (url?: string): string => {
  // デフォルト画像のURL
  const defaultImage = '/images/default-thumbnail.svg';
  
  // URLがない場合はデフォルト画像を返す
  if (!url || url.trim() === '') return defaultImage;
  
  // プロトコル相対URL（//で始まる）の場合はhttpsを追加
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // ローカルの画像の場合はそのまま返す
  if (url.startsWith('/')) return url;
  
  // 完全なURLの場合はそのまま返す
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // その他の場合はデフォルト画像を返す
  return defaultImage;
};

// Windowオブジェクトにカスタムプロパティのタイプを追加
declare global {
  interface Window {
    _trackedPromptIds: Record<string, boolean>;
  }
}

// グローバルに既に閲覧したプロンプトIDを記録
// これはブラウザのリロードでもリセットされない（windowのプロパティとして保持）
if (typeof window !== 'undefined') {
  window._trackedPromptIds = window._trackedPromptIds || {};
}

interface PromptContentProps {
  imageUrl?: string;
  title: string;
  author: {
    name: string;
    avatarUrl: string;
    bio?: string;
    publishedAt?: string;
    userId?: string;
  };
  content: string | string[];
  premiumContent?: string;
  isPaid?: boolean;
  isPreview?: boolean;
  isPremium?: boolean;
  price?: number;
  systemImageUrl?: string;
  systemUrl?: string;
  description?: string;
  reviewCount?: number;
  canDownloadYaml?: boolean;
  onDownloadYaml?: () => void;
}

// 複数プロンプト解析用の型定義
interface ParsedPrompt {
  id: number;
  title: string;
  content: string;
}

// プロンプト解析関数
const parseMultiplePrompts = (content: string): ParsedPrompt[] => {
  if (!content) return [];
  
  const trimmedContent = content.trim();
  
  // 保存時の形式「プロンプト1:」「プロンプト2:」に対応
  const promptPattern = /プロンプト(\d+):\s*/gi;
  const matches = [];
  let match;
  
  // 全てのマッチを収集
  while ((match = promptPattern.exec(trimmedContent)) !== null) {
    matches.push({
      index: match.index,
      number: parseInt(match[1]),
      matchLength: match[0].length
    });
  }
  
  // マッチが2つ以上ある場合は複数プロンプトとして処理
  if (matches.length >= 2) {
    const prompts: ParsedPrompt[] = [];
    
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      
      // 現在のマッチから次のマッチまで（または最後まで）の内容を取得
      const startIndex = currentMatch.index + currentMatch.matchLength;
      const endIndex = nextMatch ? nextMatch.index : trimmedContent.length;
      
      let promptContent = trimmedContent.substring(startIndex, endIndex).trim();
      
      // 区切り文字（---）を除去
      promptContent = promptContent.replace(/^---+\s*/, '').replace(/\s*---+$/, '').trim();
      
      if (promptContent.length > 0) {
        prompts.push({
          id: currentMatch.number,
          title: `プロンプト #${currentMatch.number}`,
          content: promptContent
        });
      }
    }
    
    return prompts.length > 0 ? prompts : [{
      id: 1,
      title: 'プロンプト',
      content: trimmedContent
    }];
  }
  
  // マッチしない場合は単一プロンプトとして扱う
  return [{
    id: 1,
    title: 'プロンプト',
    content: trimmedContent
  }];
};

// パフォーマンス最適化されたPromptContentコンポーネント
// - React.memo: 不要なリレンダリングを防止
// - useMemo: 重い計算処理のメモ化
// - useCallback: 関数の再生成を防止
// - lazy + Suspense: コード分割による初期読み込み最適化
// - 画像最適化: Next.js Image、blur placeholder、lazy loading
const PromptContent: React.FC<PromptContentProps> = ({
  imageUrl,
  title,
  author,
  content,
  premiumContent = '',
  isPaid = false,
  isPreview = false,
  isPremium = false,
  price = 0,
  systemImageUrl,
  systemUrl,
  description = '',
  reviewCount = 0,
  canDownloadYaml = false,
  onDownloadYaml = () => {}
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const router = useRouter();
  
  // プロンプトIDを取得
  const promptId = router.query.id as string;

  // ユーザー情報の取得
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
    };
    fetchUser();
  }, []);

  // 購入済み判定ロジック
  useEffect(() => {
    const checkPurchased = async () => {
      if (!currentUser || !promptId) return;
      
      try {
        // 新しいヘルパー関数を使用して購入状態を確認
        const isPurchased = await checkPurchaseStatus(currentUser.id, promptId);
        setIsPurchased(isPurchased || isPaid); // 親コンポーネントからのpropsも考慮
      } catch (e) {
        console.error('購入確認エラー:', e);
        setIsPurchased(isPaid); // エラー時は親コンポーネントの値を使用
      }
    };
    
    checkPurchased();
  }, [currentUser, promptId, isPaid]);
  
  // トラッキングが完了したかを追跡するref
  const trackingCompletedRef = useRef(false);

  // ビュートラッキング
  useEffect(() => {
    if (!promptId) return;
    
    // 既にこのコンポーネントでトラッキングが完了している場合はスキップ
    if (trackingCompletedRef.current) {
      return;
    }
    
    // windowのグローバル変数でこのIDが追跡済みかチェック
    if (typeof window !== 'undefined' && window._trackedPromptIds && window._trackedPromptIds[promptId]) {
      trackingCompletedRef.current = true;
      return;
    }
    
    // ローカルストレージでこのIDが追跡済みかチェック
    const trackingKey = `tracked_${promptId}`;
    const hasTracked = localStorage.getItem(trackingKey);
    
    if (hasTracked) {
      // グローバル変数にも記録
      if (typeof window !== 'undefined') {
        window._trackedPromptIds[promptId] = true;
      }
      trackingCompletedRef.current = true;
      return;
    }
    
    // 新規閲覧なのでトラッキング実行
    trackView(promptId).then(success => {
      if (success) {
        // 全ての記録先に保存
        localStorage.setItem(trackingKey, 'true');
        if (typeof window !== 'undefined') {
          window._trackedPromptIds[promptId] = true;
        }
        trackingCompletedRef.current = true;
      }
    });
    
    return () => {
      trackingCompletedRef.current = false;
    };
  }, [promptId]);

  // 購入ダイアログを開く - useCallbackで最適化
  const handlePurchase = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  // 購入ダイアログを閉じる - useCallbackで最適化
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);
  
  // URLを表示用に加工する関数 - useCallbackで最適化
  const formatSystemUrl = useCallback((url: string) => {
    if (!url) return '';
    
    try {
      // URLからホスト名を抽出
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      // 無効なURLの場合はそのまま返す
      return url;
    }
  }, []);

  // 改行や段落を適切に保持するヘルパー関数 - useCallbackで最適化
  const formatContentWithLineBreaks = useCallback((text: string) => {
    if (!text) return '';
    
    // HTMLタグが既に含まれている場合はそのまま返す
    if (text.includes('<') && text.includes('>')) {
      return text;
    }
    
    // プレーンテキストの場合：改行を<br>に変換し、空行を段落区切りにする
    return text
      .split('\n\n') // 空行で段落を分割
      .map(paragraph => {
        // 各段落内の改行を<br>に変換
        const formattedParagraph = paragraph
          .split('\n')
          .join('<br>');
        
        // 段落をpタグで囲む（空でない場合のみ）
        return formattedParagraph.trim() 
          ? `<p style="margin-bottom: 1em; line-height: 1.8;">${formattedParagraph}</p>` 
          : '';
      })
      .filter(p => p) // 空の段落を除去
      .join('');
  }, []);

  // 計算の重い処理をuseMemoで最適化
  const contentCalculations = useMemo(() => {
    // コンテンツが配列の場合は結合して文字列にする
    const contentText = normalizeContentText(content);
    
    // HTMLタグを除去して実際の文字数をカウントする関数
    const getActualCharCount = (text: string): number => {
      if (!text) return 0;
      
      // HTMLタグを除去
      const plainText = text.replace(/<[^>]*>/g, '');
      
      // 改行文字や余分な空白を正規化
      const normalizedText = plainText
        .replace(/\r\n/g, '\n')  // Windows改行を統一
        .replace(/\r/g, '\n')    // Mac改行を統一
        .replace(/\n+/g, '\n')   // 連続改行を単一改行に
        .trim();                 // 前後の空白を除去
      
      return normalizedText.length;
    };
    
    // 文字数カウント - HTMLタグを除去した実際の文字数
    const basicCharCount = getActualCharCount(contentText);
    const premiumCharCount = getActualCharCount(premiumContent || '');
    const characterCount = basicCharCount + premiumCharCount;

  // 無料コンテンツかどうかの判定
  const isFreeContent = isContentFree({ price, is_free: price === 0 });
  
    // 有料コンテンツかどうかの判定
  const isPremiumByHelper = isContentPremium({ price, is_free: price === 0, stripe_product_id: '', stripe_price_id: '' });
  const isPremiumContent = isPremiumByHelper || isPremium || (price > 0 && premiumContent && premiumContent.length > 0);
  
  // 全文表示するかのフラグ
  const showAllContent = shouldShowFullContent({ price, is_free: price === 0 }, isPurchased || isPaid);
  
    return {
      contentText,
      characterCount,
      premiumCharCount,
      isFreeContent,
      isPremiumContent,
      showAllContent
    };
  }, [content, premiumContent, price, isPremium, isPurchased, isPaid]);

  // プレビュー表示処理をuseMemoで最適化
  const displayContent = useMemo(() => {
    // 最初の100文字程度（約2文）を表示するための処理（改行保持版）
    const extractLimitedPreview = (text: string, charLimit: number = 100): string => {
    if (!text) return '';
      
      // まず改行を保持しながらフォーマット
      const formattedText = formatContentWithLineBreaks(text);
      
      // HTMLタグを除去してプレーンテキストにする
      const plainText = formattedText.replace(/<[^>]*>/g, '');
      
      // 指定文字数以内の場合はそのまま返す
      if (plainText.length <= charLimit) {
        return formattedText;
      }
      
      // 指定文字数でカットして省略記号を追加
      const truncatedPlainText = plainText.substring(0, charLimit) + '...';
      
      // プレーンテキストから改行を検出して、適切にフォーマット
      return formatContentWithLineBreaks(truncatedPlainText);
  };
  
    // 表示コンテンツの準備（改行と段落を適切に保持）
  let basicDisplayContent;
    if (contentCalculations.isPremiumContent && !contentCalculations.showAllContent) {
      // プレビューモードの場合 - 基本コンテンツの最初の約100文字（2文程度）を表示
      basicDisplayContent = `<div>${extractLimitedPreview(contentCalculations.contentText, 100)}</div>`;
  } else {
      // 通常表示の場合は改行と段落を保持
      basicDisplayContent = formatContentWithLineBreaks(contentCalculations.contentText);
  }

    return { basicDisplayContent, extractLimitedPreview };
  }, [contentCalculations, formatContentWithLineBreaks]);
  
  // 購入済み状態の統合
  const hasFullAccess = useMemo(() => {
    return isPurchased || isPaid || contentCalculations.showAllContent || contentCalculations.isFreeContent || !contentCalculations.isPremiumContent;
  }, [isPurchased, isPaid, contentCalculations]);
  
  // 有料部分を表示するかどうか
  const shouldShowPremiumPreview = useMemo(() => {
    return (contentCalculations.isPremiumContent || price > 0) && !hasFullAccess && premiumContent?.length > 0;
  }, [contentCalculations.isPremiumContent, price, hasFullAccess, premiumContent]);
  
  console.log('コンテンツ判定:', {
    isPurchased, 
    isPaid,
    isFreeContent: contentCalculations.isFreeContent, 
    isPremiumContent: contentCalculations.isPremiumContent, 
    isPremium, 
    price, 
    showAllContent: contentCalculations.showAllContent,
    hasFullAccess,
    shouldShowPremiumPreview,
    hasPremiumContent: Boolean(premiumContent && premiumContent.length > 0)
  });

  // プロンプト解析（メモ化）
  const parsedPrompts = useMemo(() => {
    if (!premiumContent) return [];
    return parseMultiplePrompts(premiumContent);
  }, [premiumContent]);

  // 複数プロンプトがあるかどうか
  const hasMultiplePrompts = parsedPrompts.length > 1;

  // 個別プロンプトのYAMLダウンロード関数
  const downloadIndividualYaml = (prompt: ParsedPrompt) => {
    const yamlContent = `---\nprompt: |\n  ${prompt.content.split('\n').join('\n  ')}\n---`;
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 30)}_prompt_${prompt.id}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 全プロンプトまとめてダウンロード関数
  const downloadAllPromptsYaml = () => {
    if (parsedPrompts.length === 1) {
      // 単一プロンプトの場合は通常のダウンロード
      onDownloadYaml();
      return;
    }
    
    // 複数プロンプトの場合
    const yamlContent = parsedPrompts.map((prompt, index) => 
      `prompt_${index + 1}: |\n  ${prompt.content.split('\n').join('\n  ')}`
    ).join('\n\n');
    
    const fullYaml = `---\n${yamlContent}\n---`;
    const blob = new Blob([fullYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 30)}_prompts.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Title and author section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UnifiedAvatar
                src={author.avatarUrl}
                displayName={author.name}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{author.name}</p>
                <p className="text-xs text-gray-500">
                  {author.publishedAt || 'プロンプトエンジニア'}
                </p>
              </div>
            </div>
            
            {/* 閲覧数とコンテンツ価格の表示 */}
            <div className="flex items-center space-x-3">
              {/* 閲覧数表示 */}
              {promptId && (
                <Suspense fallback={<div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>}>
                  <ViewCounter promptId={promptId} className="mr-3" />
                </Suspense>
              )}
              
              {/* 価格表示 - モバイルでも表示 */}
              {price > 0 && !hasFullAccess && (
                <div className="text-right" onClick={handlePurchase}>
                  <p className="text-sm font-normal text-gray-600 border border-gray-500 bg-white rounded px-2 py-0.5 inline-block">
                    ¥{price.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* メイン画像（あれば表示） */}
        {imageUrl && (
          <div className="rounded-md overflow-hidden aspect-video mb-2 relative bg-gray-100">
           {imageUrl.startsWith('http') ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onLoad={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                style={{
                  aspectRatio: '16/9',
                  opacity: 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
            ) : (
              <Image 
                src={getSafeImageUrl(imageUrl)}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                priority={false}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                className="object-cover"
                onLoad={() => {
                  // 画像読み込み完了時の処理
                }}
              />
            )}
          </div>
        )}

        {/* 説明文があれば表示 */}
        {description && (
          <div className="text-gray-700 mb-6">
            <p className="text-lg leading-relaxed font-noto font-normal">
              {description}
            </p>
          </div>
        )}

        {systemUrl && (
          <a 
            href={systemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded transition-colors"
            title={systemUrl}
          >
            <ExternalLink className="w-4 h-4" />
            <span>システムを見る: {formatSystemUrl(systemUrl)}</span>
          </a>
        )}
        
        {/* YAMLダウンロードセクション - プロンプト表示の真上 */}
        {canDownloadYaml && premiumContent && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">YAML形式でダウンロード</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    プロンプト内容をYAML形式で保存。AIに投げるだけで同じプロンプトを再現できます。
                  </p>
                </div>
              </div>
              <button
                onClick={downloadAllPromptsYaml}
                className="flex items-center space-x-1.5 bg-white hover:bg-green-50 border border-green-300 text-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm hover:shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                <span>YAML</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Content section */}
        <div className="relative max-w-none">
          {/* 複数プロンプト表示セクション */}
          {hasFullAccess && hasMultiplePrompts && (
            <div className="space-y-6 mb-8">
              
              
              {parsedPrompts.map((prompt, index) => (
                <div key={prompt.id} className="mb-8">
                  {/* プロンプト番号ヘッダー - シンプルに */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium mr-3">
                        #{prompt.id}
                      </span>
                      プロンプト {prompt.id}
                    </h3>
                    
                    {/* 個別プロンプトYAMLダウンロード - 小さく */}
                    {canDownloadYaml && (
                      <Button
                        onClick={() => downloadIndividualYaml(prompt)}
                        size="sm"
                        variant="outline"
                        className="px-2 py-1 text-xs border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        YAML
                      </Button>
                    )}
                  </div>
                  
                  {/* プロンプト内容 - 記事形式 */}
                  <div className="prose prose-lg max-w-none">
                    <div 
                      className="text-lg leading-loose font-noto font-normal text-gray-800"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContentWithLineBreaks(prompt.content) 
                      }}
                    />
                  </div>
                  
                  {/* 2個目以降は区切り線を追加 */}
                  {index < parsedPrompts.length - 1 && (
                    <hr className="mt-8 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 単一プロンプトまたは複数プロンプトがない場合の通常表示 */}
          {(!hasMultiplePrompts || !hasFullAccess) && (
            <>
              {/* 無料部分は常に表示 */}
              <div 
                className="text-lg leading-loose font-noto font-normal text-gray-800"
                dangerouslySetInnerHTML={{ __html: displayContent.basicDisplayContent }} 
              />
              
              {/* 有料部分 - 条件付きで表示 */}
              {premiumContent && (
                <>
                  {hasFullAccess ? (
                    /* 購入済みまたは無料の場合は全文表示 */
                    <div className="mt-6">
                      <div 
                        className="text-lg leading-loose font-noto font-normal text-gray-800"
                        dangerouslySetInnerHTML={{ __html: formatContentWithLineBreaks(premiumContent) }} 
                      />
                    </div>
                  ) : shouldShowPremiumPreview ? (
                    /* 有料で未購入の場合はプレビューと購入案内 */
                    <div className="relative">
                      {/* プレビューコンテンツの最初の2行を表示 */}
                      <div className="relative mb-8">
                        <div 
                          className="text-lg leading-loose font-noto font-normal text-gray-600"
                          dangerouslySetInnerHTML={{ 
                            __html: displayContent.extractLimitedPreview(premiumContent, 50) 
                          }} 
                        />
                        {/* グラデーション効果を改善 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"></div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-2 relative">
                          {/* 「ここから先は」テキストを点線の中に配置 */}
                          <div className="text-center w-full my-6 flex items-center justify-center">
                            <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                          <p className="text-gray-700 font-bold mx-4 bg-white px-2">ここから先は</p>
                            <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                          </div>
                        <Badge variant="outline" className="mb-1 rounded-sm border-gray-400 text-gray-600">
                          セール中
                        </Badge>
                          <div className="space-y-2 py-2"></div>

                          <div className="flex flex-col items-center justify-center py-2 relative w-full max-w-md">
                            {/* 購入セクション */}
                            <div className="text-center mb-1 w-full">
                            <h3 className="text-xl font-medium text-gray-800 mb-2">{title}</h3>
                            <p className="text-sm text-gray-600 mb-4">のヒントが詰まっています。</p>
                              
                            {/* 文字数の表示（動的） */}
                            <div className="flex items-center justify-center space-x-4 mb-4">
                              <div className="text-sm text-gray-600">
                                {contentCalculations.premiumCharCount}字
                              </div>
                                </div>
                            
                            {/* 価格表示エリア */}
                            <div className="flex items-center justify-center space-x-3 mb-6">
                              <span className="text-3xl font-bold text-red-600">¥{price.toLocaleString()}</span>
                              </div>
                              
                              {/* 購入ボタン */}
                              <Button
                              className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-sm py-3 text-lg font-medium shadow-sm transition-colors"
                                onClick={handlePurchase}
                              >
                                購入手続きへ
                              </Button>
                            
                            {/* 評価情報 - 動的表示 */}
                            {reviewCount > 0 && (
                              <div className="flex items-center justify-center mt-4 space-x-2">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-sm text-gray-600">{reviewCount}人が高評価</span>
                            </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}

          {(isPurchased || isPaid) && (
            <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
              <Check className="h-5 w-5 text-gray-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">このプロンプトは購入済みです</p>
            </div>
          )}
        </div>
      </div>
      <Suspense fallback={
        <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      }>
      <PurchaseSection
          wordCount={contentCalculations.characterCount}
        price={price}
        tags={[]}
        reviewers={[]}
        reviewCount={0}
        likes={0}
        author={{
          name: author.name,
          avatarUrl: author.avatarUrl,
          bio: author.bio || '',
          website: '',
          userId: author.userId || ''
        }}
        socialLinks={[]}
      />
      </Suspense>
      {/* Purchase Dialog */}
      <PurchaseDialog 
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        prompt={{
          id: promptId,
          title,
          author: {
            ...author,
            userId: author.userId || '',
            stripe_price_id: ''
          },
          price
        }}
        onPurchaseSuccess={() => {
          setIsPurchased(true);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
};

export default React.memo(PromptContent);
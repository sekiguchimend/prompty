import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo, startTransition } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui/button';
import { Check, Lock, FileText, Info, Eye, ExternalLink, Download, Copy } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import PurchaseDialog from './PurchaseDialog';
import Image from 'next/image';
import Link from 'next/link';
import { trackView } from '../../lib/analytics';
import { supabase } from '../../lib/supabaseClient';
import { isContentFree, shouldShowFullContent, normalizeContentText, isContentPremium } from '../../utils/content-helpers';
import { checkPurchaseStatus } from '../../utils/purchase-helpers';
import { UnifiedAvatar } from '../index';
import PurchaseSection from './PurchaseSection';
import { useAuth } from '../../lib/auth-context';
import VideoPlayer from '../common/VideoPlayer';
import LazyImage from '../common/LazyImage';
import { getOptimizedImageProps } from '../../lib/image-optimization';

// 重いコンポーネントを遅延読み込み（Code Splitting）
const ViewCounter = lazy(() => import('../view-counter'));

// 安全な画像URLを取得する関数（外部アクセス対応強化）
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
  
  // Supabaseの不完全なURLの場合
  if (url.includes('supabase.co') && !url.includes('://')) {
    return `https://${url}`;
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
  mediaType?: 'image' | 'video';
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
  previewLines?: number;
  likes?: number;
  aiModel?: string; // 使用されたAIモデル
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
  mediaType = 'image',
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
  onDownloadYaml = () => {},
  previewLines = 2,
  likes = 0,
  aiModel
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [copiedButtons, setCopiedButtons] = useState<Set<string>>(new Set()); // コピー状態を管理
  const router = useRouter();
  
  // プロンプトIDを取得
  const promptId = router.query.id as string;

  // ユーザー情報の取得（最適化: 不要なstartTransitionとsetTimeoutを削除）
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }
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
        startTransition(() => {
          setIsPurchased(isPurchased || isPaid); // 親コンポーネントからのpropsも考慮
        });
      } catch (e) {
        startTransition(() => {
          setIsPurchased(isPaid); // エラー時は親コンポーネントの値を使用
        });
      }
    };
    
    checkPurchased();
  }, [currentUser, promptId, isPaid]);
  
  // トラッキングが完了したかを追跡するref
  const trackingCompletedRef = useRef(false);

  // ビュートラッキング（サーバーサイドで処理されるため、クライアントサイドでは無効化）
  useEffect(() => {
    // ビュートラッキングはSSRで処理されるため、クライアントサイドでは実行しない
    // これにより二重カウントを防ぐ
    if (!promptId) return;
    
    // トラッキング完了のマークのみ設定（実際のトラッキングはしない）
    if (trackingCompletedRef.current) {
      return;
    }
    
    trackingCompletedRef.current = true;
    
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

  // プロンプトをクリップボードにコピーする関数
  const copyToClipboard = useCallback(async (text: string, buttonId: string) => {
    try {
      // HTMLタグを除去してプレーンテキストにする
      const plainText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      await navigator.clipboard.writeText(plainText);
      
      // コピー成功時にアイコンを変更
      setCopiedButtons(prev => new Set(prev).add(buttonId));
      
      // 2秒後にアイコンを元に戻す
      setTimeout(() => {
        setCopiedButtons(prev => {
          const newSet = new Set(prev);
          newSet.delete(buttonId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      // エラーの場合は何も表示しない（もしくは他の方法でエラー通知）
    }
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
    
    // HTMLエスケープ
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // 改行文字をHTMLの改行タグに変換し、連続する空白も保持
    const formattedText = escapedText
      .replace(/\r\n/g, '\n')  // Windows改行を統一
      .replace(/\r/g, '\n')    // Mac改行を統一
      .replace(/\n\n+/g, '<br><br>')  // 複数改行は段落として扱う
      .replace(/\n/g, '<br>')  // 単一改行をbrタグに変換
      .replace(/    /g, '&nbsp;&nbsp;&nbsp;&nbsp;')  // 4つの連続空白（インデント用）
      .replace(/   /g, '&nbsp;&nbsp;&nbsp;')  // 3つの連続空白
      .replace(/  /g, '&nbsp;&nbsp;');  // 2つの連続空白
    
    return formattedText;
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
    // 指定された行数でプレビューを表示するための処理（改行保持版）
    const extractLimitedPreviewByLines = (text: string, lineLimit: number = 3): string => {
      if (!text) return '';
      
      // プレビュー終了マーカーを探す（最初のもののみ使用）
      const previewEndMarker = '<!-- PREVIEW_END -->';
      const markerIndex = text.indexOf(previewEndMarker);
      
      if (markerIndex !== -1) {
        // マーカーが見つかった場合、そこまでを表示（マーカー自体は除去）
        const limitedText = text.substring(0, markerIndex);
        

        
        return formatContentWithLineBreaks(limitedText);
      }
      
      // マーカーがない場合は行数ベースでカット
      const lines = text.split('\n');
      const limitedLines = lines.slice(0, lineLimit);
      const limitedText = limitedLines.join('\n');
      

      
      return formatContentWithLineBreaks(limitedText);
    };

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
      basicDisplayContent = extractLimitedPreview(contentCalculations.contentText, 100);
  } else {
      // 通常表示の場合は改行と段落を保持
      basicDisplayContent = formatContentWithLineBreaks(contentCalculations.contentText);
  }

    return { basicDisplayContent, extractLimitedPreview, extractLimitedPreviewByLines };
  }, [contentCalculations, formatContentWithLineBreaks]);
  
  // 購入済み状態の統合
  const hasFullAccess = useMemo(() => {
    return isPurchased || isPaid || contentCalculations.showAllContent || contentCalculations.isFreeContent || !contentCalculations.isPremiumContent;
  }, [isPurchased, isPaid, contentCalculations]);
  
  // 有料部分を表示するかどうか
  const shouldShowPremiumPreview = useMemo(() => {
    return (contentCalculations.isPremiumContent || price > 0) && !hasFullAccess && premiumContent?.length > 0;
  }, [contentCalculations.isPremiumContent, price, hasFullAccess, premiumContent]);
  


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
              <Link href={`/users/${author.userId}`}>
                <UnifiedAvatar
                  src={author.avatarUrl}
                  displayName={author.name}
                  size="md"
                />
              </Link>
              <div>
                <Link href={`/users/${author.userId}`}>
                  <p className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">{author.name}</p>
                </Link>
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
        {/* メイン画像/動画（あれば表示） */}
        {imageUrl && (
          <div className="rounded-md overflow-hidden aspect-[16/9] mb-2 relative bg-gray-100">
            {(() => {
              // mediaTypeまたはファイル拡張子から動画かどうかを判定
              const isVideo = mediaType === 'video' || /\.(mp4|mov|avi|mkv|webm|ogv)$/i.test(imageUrl);
              
              if (isVideo) {
                return (
                  <VideoPlayer
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full"
                    hoverToPlay={true}
                    tapToPlay={true}
                    muted={true}
                    loop={true}
                    showThumbnail={true}
                    fullFeatured={true} // YouTube風の高機能プレイヤーを使用
                  />
                );
              } else if (imageUrl.startsWith('http')) {
                return (
                  <LazyImage 
                    src={imageUrl} 
                    alt={title} 
                    className="w-full h-full object-cover aspect-video"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                );
              } else {
                return (
                  <Image 
                    src={getSafeImageUrl(imageUrl)}
                    alt={title}
                    fill
                    {...getOptimizedImageProps('content')}
                    className="object-cover"
                    quality={70}
                    onLoad={() => {
                      // 画像読み込み完了時の処理
                    }}
                  />
                );
              }
            })()}
          </div>
        )}

        {/* 説明文があれば表示 */}
        {description && (
          <div className="text-gray-700 mb-6">
            <div 

className="text-lg leading-loose font-noto font-normal"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: formatContentWithLineBreaks(description) }}
            />
          </div>
        )}

        {/* AIモデル情報表示 */}
        {aiModel && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">使用モデル:</span>
              <span className="text-sm text-blue-600 font-mono">{aiModel}</span>
            </div>
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
                    
                  
                  </div>
                  
                  {/* プロンプト内容 - 記事形式 */}
                  <div className="prose prose-lg max-w-none">
                    <div className={`relative rounded-lg p-4 ${!hasFullAccess && contentCalculations.isPremiumContent ? 'bg-gradient-to-b from-gray-100 via-gray-100 to-white' : 'bg-gray-100'}`}>
                      {/* コピーボタン - 有料記事で未購入の場合は非表示 */}
                      {(hasFullAccess || !contentCalculations.isPremiumContent) && (
                        <button
                          onClick={() => copyToClipboard(prompt.content, `prompt-${prompt.id}`)}
                          className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                          title="プロンプトをコピー"
                        >
                          {copiedButtons.has(`prompt-${prompt.id}`) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {/* 有料記事で未購入の場合の文字フェード効果 */}
                      {!hasFullAccess && contentCalculations.isPremiumContent && (
                        <div 
                          className="absolute left-0 right-0 bottom-0 pointer-events-none rounded-lg"
                          style={{
                            height: `${1.8 * 1.5}em`, // プレビュー部分と同じ高さ
                            background: 'linear-gradient(to top, rgba(247,247,247,1) 0%, rgba(247,247,247,0.8) 20%, rgba(247,247,247,0.4) 50%, rgba(247,247,247,0) 80%)'
                          }}
                        />
                      )}
                      <div 
                        className="text-lg leading-loose font-noto font-normal text-gray-800 pr-12"
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ 
                          __html: formatContentWithLineBreaks(prompt.content) 
                        }}
                      />
                    </div>
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
              {/* プロンプト内容表示 - 無料部分と有料部分を統合 */}
              <div className="relative rounded-lg p-4 bg-gray-100">
                {/* コピーボタン - 有料記事で未購入の場合は非表示 */}
                {(hasFullAccess || !contentCalculations.isPremiumContent) && (
                  <button
                    onClick={() => copyToClipboard(hasFullAccess && premiumContent ? contentCalculations.contentText + '\n\n' + premiumContent : contentCalculations.contentText, 'main-prompt')}
                    className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                    title="プロンプトをコピー"
                  >
                    {copiedButtons.has('main-prompt') ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                {/* 無料部分 */}
                <div 
                  className="text-lg leading-loose font-noto font-normal text-gray-800 pr-12"
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: displayContent.basicDisplayContent }} 
                />
                
                {/* 有料部分 - 購入済みの場合は全文表示 */}
                {premiumContent && hasFullAccess && (
                  <div className="mt-4 pt-4">
                    <div 
                      className="text-lg leading-loose font-noto font-normal text-gray-800"
                      style={{ whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ __html: formatContentWithLineBreaks(premiumContent) }} 
                    />
                  </div>
                )}
                
                {/* 有料部分プレビュー（未購入の場合） */}
                {premiumContent && !hasFullAccess && shouldShowPremiumPreview && (
                  <div className="mt-4">
                    <div 
                      className="text-lg leading-loose font-noto font-normal text-gray-800 pr-12"
                      style={{ whiteSpace: 'pre-wrap' }}
                      dangerouslySetInnerHTML={{ 
                        __html: displayContent.extractLimitedPreviewByLines(premiumContent, previewLines) 
                      }} 
                    />
                  </div>
                )}
                
                {/* プロンプト表示のフェイドアウト効果（有料記事で未購入の場合） */}
                {!hasFullAccess && contentCalculations.isPremiumContent && (
                  <div 
                    className="absolute left-0 right-0 bottom-0 pointer-events-none rounded-b-lg"
                    style={{
                      height: '6em',
                      background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 10%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 75%, rgba(255,255,255,0) 100%)'
                    }}
                  />
                )}
              </div>
              
              {/* 「ここから先は」テキスト（プロンプト表示の外側） */}
              {premiumContent && !hasFullAccess && shouldShowPremiumPreview && (
                <div className="text-center w-full mt-4 mb-4 flex items-center justify-center">
                  <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                  <p className="text-gray-700 font-bold mx-4 bg-white px-2">ここから先は</p>
                  <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                </div>
              )}
              
              {/* 購入セクション（プロンプト表示の外側） */}
              {premiumContent && !hasFullAccess && shouldShowPremiumPreview && (
                <div className="flex flex-col items-center justify-center py-1 relative mt-4">
                  <Badge variant="outline" className="mb-1 rounded-sm border-gray-400 text-gray-600 bg-white">
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
        likes={likes}
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
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Check, Lock, FileText, Info } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ExternalLink } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog';
import Image from 'next/image';
import { trackView } from '../../lib/analytics';
import ViewCounter from '../ViewCounter';
import { supabase } from '../../lib/supabaseClient';
import { isContentFree, shouldShowFullContent, normalizeContentText, isContentPremium } from '../../utils/content-helpers';
import { checkPurchaseStatus } from '../../utils/purchase-helpers';
import PurchaseSection from './PurchaseSection';
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
}

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
  reviewCount = 0
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

  // コンテンツが配列の場合は結合して文字列にする
  const contentText = normalizeContentText(content);
  
  // 文字数カウント - 無料部分と有料部分の文字数を合計
  const basicCharCount = typeof content === 'string' 
    ? content.length 
    : Array.isArray(content) 
      ? content.join('').length 
      : 0;
  
  const premiumCharCount = premiumContent?.length || 0;
  const characterCount = basicCharCount + premiumCharCount;

  // 購入ダイアログを開く
  const handlePurchase = () => {
    setIsDialogOpen(true);
  };

  // 購入ダイアログを閉じる
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  // URLを表示用に加工する関数
  const formatSystemUrl = (url: string) => {
    if (!url) return '';
    
    try {
      // URLからホスト名を抽出
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      // 無効なURLの場合はそのまま返す
      return url;
    }
  };

  // 無料コンテンツかどうかの判定
  const isFreeContent = isContentFree({ price, is_free: price === 0 });
  
  // 有料コンテンツかどうかの判定（複合条件）
  // 1. isContentPremium関数の判定
  // 2. 親コンポーネントからの明示的なisPremiumフラグ
  // 3. price > 0という基本条件
  // 4. premiumContentが存在し、かつprice > 0の場合
  const isPremiumByHelper = isContentPremium({ price, is_free: price === 0, stripe_product_id: '', stripe_price_id: '' });
  const isPremiumContent = isPremiumByHelper || isPremium || (price > 0 && premiumContent && premiumContent.length > 0);
  
  // 全文表示するかのフラグ
  const showAllContent = shouldShowFullContent({ price, is_free: price === 0 }, isPurchased || isPaid);
  
  // 最初の2行のみ表示するための処理（3行から2行に変更）
  const extractFirstTwoLines = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    if (lines.length <= 2) return text;
    return lines.slice(0, 2).join('\n');
  };
  
  // 表示コンテンツの準備
  // プレミアムでない場合またはすでに購入済みの場合は全文表示
  let basicDisplayContent;
  if (isPremiumContent && !showAllContent) {
    basicDisplayContent = `<div>${extractFirstTwoLines(contentText)}</div>`;
  } else {
    basicDisplayContent = contentText;
  }
  
  // 購入済み状態の統合 - 複数の条件をまとめる
  const hasFullAccess = isPurchased || isPaid || showAllContent || isFreeContent || !isPremiumContent;
  
  // 有料部分を表示するかどうか
  const shouldShowPremiumPreview = (isPremiumContent || price > 0) && !hasFullAccess && premiumContent?.length > 0;
  
  console.log('コンテンツ判定:', {
    isPurchased, 
    isPaid,
    isFreeContent, 
    isPremiumContent, 
    isPremiumByHelper,
    isPremium, 
    price, 
    showAllContent,
    hasFullAccess,
    shouldShowPremiumPreview,
    hasPremiumContent: Boolean(premiumContent && premiumContent.length > 0)
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Title and author section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {author.avatarUrl && (
                  author.avatarUrl.startsWith('http') ? (
                    <img 
                      src={author.avatarUrl} 
                      alt={author.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image 
                      src={author.avatarUrl} 
                      alt={author.name}
                      width={40}
                      height={40}
                      priority={true} 
                      className="w-full h-full object-cover"
                    />
                  )
                )}
              </div>
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
              {promptId && <ViewCounter promptId={promptId} className="mr-3" />}
              
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
          <div className="rounded-md overflow-hidden aspect-video mb-2 relative">
           
           {imageUrl.startsWith('http') ? (
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Image 
                src={`/${imageUrl}`}
                alt={title}
                width={800}
                height={450}
                priority={true} 
                className="w-full h-full object-cover"
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
        
        {/* Content section */}
        <div className="relative prose max-w-none">
          {/* 無料部分は常に表示 */}
          <div dangerouslySetInnerHTML={{ __html: basicDisplayContent }} />
          
          {/* 有料部分 - 条件付きで表示 */}
          {premiumContent && (
            <>
              {hasFullAccess ? (
                /* 購入済みまたは無料の場合は全文表示 */
                <div className="mt-6">
                  <div dangerouslySetInnerHTML={{ __html: premiumContent }} />
                </div>
              ) : shouldShowPremiumPreview ? (
                /* 有料で未購入の場合はプレビューと購入案内 */
                <div className="relative">
                  {/* プレビューコンテンツの最初の2行を表示 */}
                  <div className="relative mb-8">
                    <div 
                      className="text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: extractFirstTwoLines(premiumContent) 
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
                            {premiumCharCount}字
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

          {(isPurchased || isPaid) && (
            <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
              <Check className="h-5 w-5 text-gray-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">このプロンプトは購入済みです</p>
            </div>
          )}
        </div>
      </div>
      <PurchaseSection
        wordCount={characterCount}
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
          userId: ''
        }}
        socialLinks={[]}
      />
      {/* Purchase Dialog */}
      <PurchaseDialog 
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        prompt={{
          id: promptId,
          title,
          author: {
            ...author,
            userId: '',
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

export default PromptContent;
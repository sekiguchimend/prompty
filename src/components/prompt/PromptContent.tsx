import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Check, Lock, FileText, Info } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ExternalLink } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog'; // Import the PurchaseDialog component
import Image from 'next/image';
import { trackView } from '../../lib/analytics';
import ViewCounter from '../ViewCounter';

// WindowオブジェクトにカスタムプロパティのTypeを追加
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
  isPaid?: boolean;
  isPreview?: boolean;
  price?: number;
  systemImageUrl?: string;
  systemUrl?: string;
  description?: string;
}

const PromptContent: React.FC<PromptContentProps> = ({
  imageUrl,
  title,
  author,
  content,
  isPaid = false,
  isPreview = true,
  price = 0,
  systemImageUrl,
  systemUrl,
  description = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  
  // プロンプトIDを取得
  const promptId = router.query.id as string;
  
  // トラッキングが完了したかを追跡するref
  const trackingCompletedRef = useRef(false);

  // ビュートラッキング - 厳格なバージョン
  useEffect(() => {
    if (!promptId) return;
    
    // 1. すでにこのコンポーネントのライフサイクルでトラッキングが完了している場合はスキップ
    if (trackingCompletedRef.current) {
      console.log('このコンポーネントのレンダリングサイクルで既に追跡済み');
      return;
    }
    
    // 2. windowのグローバル変数でこのIDが追跡済みかチェック
    if (typeof window !== 'undefined' && window._trackedPromptIds && window._trackedPromptIds[promptId]) {
      console.log('ブラウザセッションで既に追跡済み:', promptId);
      trackingCompletedRef.current = true;
      return;
    }
    
    // 3. ローカルストレージでこのIDが追跡済みかチェック
    const trackingKey = `tracked_${promptId}`;
    const hasTracked = localStorage.getItem(trackingKey);
    
    if (hasTracked) {
      console.log('ローカルストレージで既に追跡済み:', promptId);
      // グローバル変数にも記録
      if (typeof window !== 'undefined') {
        window._trackedPromptIds[promptId] = true;
      }
      trackingCompletedRef.current = true;
      return;
    }
    
    // 4. ここまで来たら新規閲覧なのでトラッキング実行
    console.log('新規閲覧としてトラッキング開始:', promptId);
    trackView(promptId).then(success => {
      if (success) {
        // 全ての記録先に保存
        localStorage.setItem(trackingKey, 'true');
        if (typeof window !== 'undefined') {
          window._trackedPromptIds[promptId] = true;
        }
        trackingCompletedRef.current = true;
        console.log('トラッキング完了:', promptId);
      }
    });
    
    // 念のため、ページを離れる時にもrefをリセット
    return () => {
      trackingCompletedRef.current = false;
    };
  }, [promptId]);

  // コンテンツが配列の場合は結合して文字列にする
  const contentText = Array.isArray(content) ? content.join('\n') : content;
  
  // Calculate the character count
  const characterCount = Array.isArray(content) 
    ? content.join('').length 
    : contentText.length;

  const handlePurchase = () => {
    setIsDialogOpen(true); // Open the dialog instead of redirecting
  };

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
              {price > 0 && (
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
          {isPreview ? (
            <div className="relative">
            <div className="mb-2">
                <div dangerouslySetInnerHTML={{ __html: contentText.slice(0, 500) }} />
              </div> 
              {/* + '...'  */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                </div>

                <div className="flex flex-col items-center justify-center py-2 relative">
                  {/* 「ここから先は」テキストを修正 - 点線の中に配置 */}
                  <div className="text-center w-full my-6 flex items-center justify-center">
                    <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                    <p className="text-gray-700 font-bold mx-4">ここから先は</p>
                    <div className="border-t border-dashed border-gray-300 w-1/4"></div>
                  </div>
                  <Badge variant="outline" className="mb-1 rounded-sm">プレミアムコンテンツ</Badge>
                  <div className="space-y-2 py-2">
                  </div>

                  <div className="flex flex-col items-center justify-center py-2 relative w-full max-w-md">
                    {/* Updated purchase section to match the image */}
                    <div className="text-center mb-1 w-full">
                      <h3 className="text-xl font-medium text-gray-800 mb-4">モデルとプロンプトをみませんか?</h3>
                      <p className="text-gray-600 mb-3">{characterCount}字</p>
                      <p className="text-4xl font-bold mb-4">¥ {price.toLocaleString()}</p>
                      
                      {/* Added information items with icons */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center text-left text-sm text-gray-700">
                          <FileText className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                          <span>使用されたモデルについての詳細な情報</span>
                        </div>
                        <div className="flex items-center text-left text-sm text-gray-700">
                          <Info className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
                          <span>実際に使用されたプロンプトの全文</span>
                        </div>
                      </div>
                      
                      {/* Full-width purchase button */}
                      <Button
                        className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-md py-3 text-lg font-medium mt-2"
                        onClick={handlePurchase}
                      >
                        購入手続きへ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: contentText }} />
          )}

          {isPaid && (
            <div className="flex items-center mt-6 p-4 border border-gray-200 rounded-sm bg-gray-50">
              <Check className="h-5 w-5 text-gray-600 mr-2" />
              <p className="text-sm font-medium text-gray-700">このプロンプトは購入済みです</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add PurchaseDialog component here */}
      <PurchaseDialog 
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        prompt={{
          title,
          author,
          price
        }}
      />
    </div>
  );
};

export default PromptContent;
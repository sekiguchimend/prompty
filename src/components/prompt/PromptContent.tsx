import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Check, Lock, FileText, Info, Link } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { ExternalLink } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog'; // Import the PurchaseDialog component

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
  systemUrl
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Changed to false as default
  const router = useRouter();

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
 
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Title and author section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
  <div className="w-10 h-10 rounded-full overflow-hidden">
    <img 
      src={author.avatarUrl} 
      alt={author.name} 
      className="w-full h-full object-cover"
    />
  </div>
  <div>
    <p className="text-sm font-medium text-gray-700">{author.name}</p>
    <p className="text-xs text-gray-500">
      {author.publishedAt || 'プロンプトエンジニア'}
    </p>
  </div>
</div>
            {/* 価格表示 - モバイルでも表示 */}
            {price > 0 && (
              
                <div className="text-right"onClick={handlePurchase}>
                  <p className="text-sm font-normal text-gray-600 border border-gray-500 bg-white rounded px-2 py-0.5 inline-block">
                    ¥{price.toLocaleString()}
                  </p>
                </div>
             
            )}
          </div>
        </div>

        {/* メイン画像（あれば表示） */}
        {imageUrl && (
          <div className="rounded-md overflow-hidden aspect-video mb-2">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <button 
          // onClick={onClick}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>システムを見る</span>
        </button>
        {/* Content section */}
        <div className="relative prose max-w-none">
          {isPreview ? (
            <div className="relative">
              <div className="mb-6">
                <div dangerouslySetInnerHTML={{ __html: contentText.slice(0, 500) + '...' }} />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
                </div>

                <div className="flex flex-col items-center justify-center py-8 relative">
                  <Badge variant="outline" className="mb-2 rounded-sm">プレミアムコンテンツ</Badge>
                  <div className="space-y-4 py-4">
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 relative w-full max-w-md">
                    {/* Updated purchase section to match the image */}
                    <div className="text-center mb-6 w-full">
                      <h3 className="text-xl font-medium text-gray-800 mb-4">モデルとプロンプトが必要ですか?</h3>
                      <p className="text-gray-600 mb-1">{characterCount}字</p>
                      <p className="text-4xl font-bold mb-2">¥ {price.toLocaleString()}</p>
                      
                      {/* Added information items with icons */}
                      <div className="space-y-3 mb-6">
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
                        className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-md py-6 text-lg font-medium"
                        onClick={handlePurchase} // Use the same handler as the price button
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
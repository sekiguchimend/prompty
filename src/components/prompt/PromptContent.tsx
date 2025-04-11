
import React, { useState } from 'react';
import PurchaseDialog from './PurchaseDialog';
import { ExternalLink, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromptContentProps {
  title: string;
  content: string[];
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    publishedAt: string;
    website?: string;
  };
  price: number;
  systemImageUrl?: string;
  systemUrl?: string;
}

const PromptContent: React.FC<PromptContentProps> = ({ 
  title, 
  content, 
  author, 
  price, 
  systemImageUrl,
  systemUrl
}) => {
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  return (
    <article>
      <h1 className="text-3xl font-bold mb-8 leading-tight">{title}</h1>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img 
            src={author.avatarUrl} 
            alt={author.name}
            className="w-6 h-6 rounded-full mr-2" 
          />
          <div>
            <p className="text-xs font-medium">{author.bio}</p>
            <p className="text-xs text-gray-500">{author.publishedAt}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsPurchaseDialogOpen(true)}
          className="border border-gray-300 rounded-md py-1 px-3 hover:bg-gray-50 transition-colors"
        >
          <span className="font-bold text-sm text-green-600">¥{price.toLocaleString()}</span>
        </button>
      </div>
      
      <div className="prose prose-gray max-w-none my-6 text-lg">
        {content.map((paragraph, index) => (
          <p key={index} className="mb-6">{paragraph}</p>
        ))}
      </div>

      {/* System Image and URL */}
      {systemImageUrl && (
        <div className="my-8 border border-gray-200 rounded-lg overflow-hidden">
          <img 
            src={systemImageUrl} 
            alt="システムのスクリーンショット" 
            className="w-full h-auto"
          />
        </div>
      )}

      {systemUrl && (
        <div className="my-6">
          <a 
            href={systemUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            システムを見る
          </a>
        </div>
      )}

      {/* Preview message and purchase button */}
      <div className="mt-10 mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-xl font-medium text-center mb-4">ここから先は</h3>
        <p className="text-center mb-6">使用したモデルとプロンプトを知りたい場合は、購入してください。</p>
        <Button 
          onClick={() => setIsPurchaseDialogOpen(true)}
          className="w-full bg-gray-900 text-white py-3 text-lg font-medium hover:bg-gray-800"
        >
          購入手続きへ（¥{price.toLocaleString()}）
        </Button>
      </div>

      <PurchaseDialog 
        isOpen={isPurchaseDialogOpen} 
        onClose={() => setIsPurchaseDialogOpen(false)}
        prompt={{
          title,
          author,
          price
        }}
      />
    </article>
  );
};

export default PromptContent;

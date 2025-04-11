
import React, { useState } from 'react';
import PurchaseDialog from './PurchaseDialog';

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
}

const PromptContent: React.FC<PromptContentProps> = ({ title, content, author, price }) => {
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
      
      <div className="prose prose-gray max-w-none my-10 text-lg">
        {content.map((paragraph, index) => (
          <p key={index} className="mb-6">{paragraph}</p>
        ))}
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

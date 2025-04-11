
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import AvatarGroup from '@/components/AvatarGroup';
import { Heart, Share2, MessageSquare, MoreHorizontal, FileText, PenTool } from 'lucide-react';
import PurchaseDialog from './PurchaseDialog';

interface PurchaseSectionProps {
  wordCount: number;
  price: number;
  tags: string[];
  reviewers: string[];
  reviewCount: number;
  likes: number;
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
    website: string;
  };
  socialLinks: {
    icon: string;
    url: string;
  }[];
}

const PurchaseSection: React.FC<PurchaseSectionProps> = ({ 
  wordCount, 
  price, 
  tags, 
  reviewers, 
  reviewCount,
  likes,
  author,
  socialLinks
}) => {
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  
  return (
    <div className="mt-16 border-t border-gray-200 pt-10">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">モデルとプロンプトが必要ですか？</h3>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">{wordCount}字</p>
        <p className="text-3xl font-bold mb-2">¥ {price}</p>
      </div>
      
      <div className="text-center text-sm text-blue-600 mb-6">
        <span>Amazon Pay支払いで総額2,025万円を山分け！</span>
        <a href="#" className="ml-2 text-blue-600 underline">詳細</a>
      </div>
      
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3 text-gray-700">
          <FileText className="h-5 w-5 text-gray-500" />
          <span>使用されたモデルについての詳細な情報</span>
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <PenTool className="h-5 w-5 text-gray-500" />
          <span>実際に使用されたプロンプトの全文</span>
        </div>
      </div>
      
      <Button 
        className="w-full bg-gray-900 text-white py-3 text-lg font-medium hover:bg-gray-800 mb-4"
        onClick={() => setIsPurchaseDialogOpen(true)}
      >
        購入手続きへ
      </Button>
      
      <div className="flex justify-center mb-6">
        <AvatarGroup avatars={reviewers} count={reviewCount} />
      </div>
      
      <div className="flex justify-center mb-8">
        <Link to="/login" className="text-gray-900 font-medium hover:underline">
          ログイン
        </Link>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="px-4 py-1 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer"
          >
            #{tag}
          </Badge>
        ))}
      </div>
      
      {/* Social interaction buttons */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button className="flex items-center text-gray-500 hover:text-red-500 focus:outline-none">
            <Heart className="h-6 w-6 mr-1 text-red-400" fill="#F87171" />
            <span>{likes}</span>
          </button>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Tip section */}
      <div className="bg-gray-50 p-4 rounded-md mb-10">
        <div className="text-center mb-4">
          <p className="text-gray-700">この記事が気に入ったらチップで応援してみませんか？</p>
        </div>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            className="bg-white border border-gray-300 text-gray-800 font-medium flex items-center space-x-1 px-5"
          >
            <Heart className="h-4 w-4" />
            <span>チップで応援</span>
          </Button>
        </div>
      </div>
      
      {/* Author profile - Smaller version */}
      <div className="border-t border-gray-200 pt-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium">{author.name}</h4>
              <p className="text-xs text-gray-600 mt-1">
                <span>📚新刊『発信をお金にかえる勇気』予約開始！！</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                著者、コンサルタント/『発信する勇気』（きずな出版）/ コンテンツビジネススクール主宰 / 公式メルマガ→
                <a href={author.website} className="text-blue-600 hover:underline">{author.website}</a>
              </p>
              
              <div className="flex space-x-2 mt-2">
                {socialLinks.map((link, index) => (
                  <a key={index} href={link.url} className="text-gray-500 hover:text-gray-700">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200">
                      <span className="text-xs">{link.icon.charAt(0).toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <Button 
            className="bg-gray-900 text-white hover:bg-gray-800 rounded-md text-xs py-1 px-3 h-auto"
          >
            フォロー
          </Button>
        </div>
      </div>
      
      <PurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onClose={() => setIsPurchaseDialogOpen(false)}
        prompt={{
          title: author.name,
          author,
          price
        }}
      />
    </div>
  );
};

export default PurchaseSection;

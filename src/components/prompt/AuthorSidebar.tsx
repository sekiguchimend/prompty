import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface AuthorSidebarProps {
  author: {
    name: string;
    avatarUrl: string;
    bio: string;
  };
  tags: string[];
  website: string;
}

const AuthorSidebar: React.FC<AuthorSidebarProps> = ({ author, tags, website }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFollowClick = () => {
    setIsAnimating(true);
    
    // アニメーション用のタイムアウト
    setTimeout(() => {
      setIsAnimating(false);
      setIsFollowing(!isFollowing);
      
      // トースト通知表示
      if (!isFollowing) {
        toast({
          title: `${author.name}さんをフォローしました`,
          description: "新しい投稿があればお知らせします",
        });
      } else {
        toast({
          title: `${author.name}さんのフォローを解除しました`,
          variant: "destructive"
        });
      }
    }, 300);
  };

  return (
    <div className="sticky top-20">
      <div className="flex flex-col items-start">
        {/* Author profile section */}
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <div className="w-14 h-14 rounded-full overflow-hidden mr-2">
              <img 
                src={author.avatarUrl} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium">{author.name}</h3>
              <p className="text-xs text-gray-500">{author.bio}</p>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-2 mb-4">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center">
              {index === 0 && <span className="mr-1">👉</span>}
              <span>{tag}</span>
            </div>
          ))}
          <div className="pt-1">
            <a href={website} className="text-gray-400 hover:text-gray-600 text-xs truncate block">
              {website}
            </a>
          </div>
        </div>
        
        <Button 
          variant={isFollowing ? "outline" : "default"}
          className={`w-full mb-4 ${
            isFollowing 
              ? 'border border-gray-300 hover:bg-gray-100 text-gray-900' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } rounded-sm text-sm py-1 h-auto transition-all duration-200 ${
            isAnimating ? 'scale-95' : ''
          }`}
          onClick={handleFollowClick}
        >
          <span className="mr-1">{isFollowing ? '✓' : '👤'}</span> 
          {isFollowing ? 'フォロー中' : 'フォロー'}
        </Button>
      </div>
    </div>
  );
};

export default AuthorSidebar;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
          variant="outline" 
          className="w-full mb-4 bg-gray-900 text-white hover:bg-gray-800 rounded-sm text-sm py-1 h-auto"
        >
          <span className="mr-1">👤</span> フォロー
        </Button>
      </div>
    </div>
  );
};

export default AuthorSidebar;

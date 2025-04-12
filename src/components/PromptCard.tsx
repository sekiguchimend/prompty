
import React from 'react';
import { Heart,Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PromptCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  postedAt: string;
  likeCount: number;
}

const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  thumbnailUrl,
  user,
  postedAt,
  likeCount,
}) => {
  // Extract the base ID without any prefix for the actual prompt ID
  const promptId = id.includes('-') ? id.split('-')[1] : id;
  
  return (
    <div className="prompt-card flex flex-col overflow-hidden rounded-md border bg-white shadow-sm">
      <Link to={`/prompts/${promptId}`} className="block">
        <div className="relative pb-[56.25%]">
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </Link>
      <div className="flex flex-col p-3">
        <Link to={`/prompts/${promptId}`} className="mb-2 line-clamp-2 font-medium hover:text-prompty-primary">
          {title}
        </Link>
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <Link to={`/users/${user.name}`} className="block h-6 w-6 overflow-hidden rounded-full">
              <img 
                src={user.avatarUrl} 
                alt={user.name} 
                className="h-full w-full object-cover"
              />
            </Link>
            <Link to={`/users/${user.name}`} className="text-xs text-gray-600 hover:underline">
              {user.name}
            </Link>
            <span className="text-xs text-gray-500">{postedAt}</span>
          </div>
          <div className="flex items-center">
          <div className="flex items-center text-gray-500 mt-4">
            <button className="like-button flex items-center">
              <Heart className="mr-1 h-4 w-4" />
            </button>
            <span className="text-xs">{likeCount}</span>
          </div>
          <div className="flex items-center text-gray-500 mt-4 ml-2">
          <button className="like-button flex items-center">
              <Bookmark className="mr-1 h-4 w-4" />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;

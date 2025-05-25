import React from 'react';
import { Badge } from '../components/ui/badge';
import { Heart, MessageSquare } from 'lucide-react';
import { UnifiedAvatar } from '../components/index';

// Post型の定義
interface PostUser {
  userId: string;
  name: string;
  avatarUrl?: string;
}

interface Post {
  id: string;
  user: PostUser;
  postedAt: string;
  // 必要に応じて他のプロパティを追加
}

interface PostCardProps {
  post: {
    id: string;
    title: string;
    thumbnailUrl: string;
    user: {
      name: string;
      avatarUrl: string;
    };
    postedAt: string;
    likeCount: number;
    commentCount?: number;
    tags?: string[];
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <img src={post.thumbnailUrl} alt={post.title} className="w-full h-32 object-cover rounded mb-3" />
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UnifiedAvatar
            src={post.user.avatarUrl}
            displayName={post.user.name}
            size="xs"
          />
          <span className="text-sm text-gray-600">{post.user.name}</span>
        </div>
        <span className="text-xs text-gray-500">{post.postedAt}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{post.likeCount}</span>
          </div>
          {post.commentCount !== undefined && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{post.commentCount}</span>
            </div>
          )}
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1">
            {post.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard; 
import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Eye, Heart, MessageSquare, Edit, Bookmark } from 'lucide-react';
import { PostData } from '../../types/content';
import { getDisplayName, getAvatarUrl } from '../../types/profile';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { UnifiedAvatar } from '../index';

interface PostCardProps {
  post: PostData;
  isSaved?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isSaved = false }) => {
  // 著者の表示名を取得（nullや空の場合は「匿名」）
  const authorDisplayName = post.author ? getDisplayName(post.author.display_name) : '';
  // 著者のアバターURLを取得
  const authorAvatarUrl = post.author ? getAvatarUrl(post.author.avatar_url) : '';

  return (
    <article className="mb-6 pb-6 border-b border-gray-100">
      <div className="flex flex-col md:flex-row gap-4">
        {post.thumbnail_url && (
          <div className="md:w-40 h-40 md:h-28 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
            <img 
              src={post.thumbnail_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1">
          <Link href={`/prompts/${post.id}`} className="block">
            <h2 className="text-base md:text-lg font-bold text-gray-800 hover:text-gray-600 mb-2 md:mb-3 line-clamp-2">
              {post.title}
            </h2>
          </Link>
          
          {post.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {post.description}
            </p>
          )}
          
          <div className="flex items-center text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
            {isSaved && post.author && (
              <Link href={`/users/${post.author.username || post.author.id}`} className="flex items-center mr-4">
                <UnifiedAvatar
                  src={authorAvatarUrl}
                  displayName={authorDisplayName}
                  size="sm"
                />
                <span>{authorDisplayName}</span>
              </Link>
            )}
            <span>{post.created_at}</span>
            {post.is_premium && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">
                ¥{post.price}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-gray-500 text-xs md:text-sm">
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.view_count}</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.like_count}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span>{post.comment_count}</span>
            </div>
            {!isSaved && (
              <Link href={`/edit-prompt/${post.id}`} className="ml-auto text-blue-500 flex items-center">
                <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                <span>編集</span>
              </Link>
            )}
            {isSaved && (
              <div className="ml-auto flex items-center text-blue-500">
                <Bookmark className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 fill-blue-500" />
                <span>保存済み</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard; 
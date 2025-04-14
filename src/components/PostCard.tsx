import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const PostCard = ({ post }) => {
  return (
    <div className="flex items-center">
      <Link to={`/users/${post.user.userId}`} className="flex items-center">
        <Avatar className="h-5 w-5 mr-1.5">
          <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-gray-500 text-sm hover:text-gray-700">{post.user.name}</span>
      </Link>
      <span className="text-gray-500 text-sm ml-2">{post.postedAt}</span>
    </div>
  );
};

export default PostCard; 
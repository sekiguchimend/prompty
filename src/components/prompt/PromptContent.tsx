
import React from 'react';

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
  return (
    <article>
      <h1 className="text-3xl font-bold mb-4 leading-tight">{title}</h1>
      
      {/* Price display - added prominent styling */}
      <div className="mb-6">
        <p className="text-green-600 font-bold text-xl">¥{price.toLocaleString()}</p>
      </div>
      
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
      </div>
      
      <div className="prose prose-gray max-w-none my-10 text-lg">
        {content.map((paragraph, index) => (
          <p key={index} className="mb-6">{paragraph}</p>
        ))}
      </div>
    </article>
  );
};

export default PromptContent;

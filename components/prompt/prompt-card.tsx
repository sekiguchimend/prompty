import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, truncateText } from '../../lib/utils';
import { Button } from '../../src/components/ui/button';
import { UnifiedAvatar } from '../../src/components/index';

interface PromptCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  category: string;
  likeCount: number;
}

export default function PromptCard({
  id,
  title,
  description,
  imageUrl,
  author,
  createdAt,
  category,
  likeCount,
}: PromptCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      {imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {category}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(createdAt)}
          </span>
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{truncateText(description, 120)}</p>
      </div>
      <div className="flex items-center justify-between p-6 pt-0">
        <div className="flex items-center space-x-2">
          <UnifiedAvatar
            src={author.avatarUrl}
            displayName={author.name}
            size="xs"
          />
          <span className="text-sm font-medium">{author.name}</span>
        </div>
        <Link href={`/prompts/${id}`}>
          <Button size="sm" variant="outline">
            詳細を見る
          </Button>
        </Link>
      </div>
    </div>
  );
} 
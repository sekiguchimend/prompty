"use client";

import React from 'react';
// import type { Metadata } from 'next';
import PromptCard from '@/components/prompt/prompt-card';

// export const metadata: Metadata = {
//   title: 'プロンプト一覧',
//   description: '様々なプロンプトを探索しましょう',
// };

// モックデータ
const mockPrompts = [
  {
    id: '1',
    title: 'GPT-4を最大限に活用するためのプロンプト',
    description: 'GPT-4の性能を最大限に引き出すためのプロンプトエンジニアリングテクニックを紹介します。具体例や実践的なアドバイスも含まれています。',
    imageUrl: 'https://via.placeholder.com/500x300',
    author: {
      name: '山田太郎',
      avatarUrl: 'https://via.placeholder.com/50x50',
    },
    createdAt: '2024-04-10T12:00:00Z',
    category: 'プロンプトエンジニアリング',
    likeCount: 120,
  },
  {
    id: '2',
    title: '文章校正・添削のための最適プロンプト',
    description: '文章の校正や添削を行うための最適なプロンプトです。文法、構成、読みやすさなどを改善するためのアドバイスが得られます。',
    imageUrl: 'https://via.placeholder.com/500x300',
    author: {
      name: '佐藤花子',
      avatarUrl: 'https://via.placeholder.com/50x50',
    },
    createdAt: '2024-04-09T15:30:00Z',
    category: '文章校正',
    likeCount: 85,
  },
  {
    id: '3',
    title: 'ビジネスアイデア生成プロンプト',
    description: '新しいビジネスアイデアやスタートアップのコンセプトを生成するためのプロンプトです。市場分析や実現可能性の評価も含まれています。',
    imageUrl: 'https://via.placeholder.com/500x300',
    author: {
      name: '鈴木一郎',
      avatarUrl: 'https://via.placeholder.com/50x50',
    },
    createdAt: '2024-04-08T09:15:00Z',
    category: 'ビジネス',
    likeCount: 210,
  },
];

export default function PromptsPage() {
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">プロンプト一覧</h1>
        <p className="text-muted-foreground">
          様々なカテゴリのプロンプトを探索して、あなたの目的に合ったプロンプトを見つけましょう。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
        {mockPrompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            id={prompt.id}
            title={prompt.title}
            description={prompt.description}
            imageUrl={prompt.imageUrl}
            author={prompt.author}
            createdAt={prompt.createdAt}
            category={prompt.category}
            likeCount={prompt.likeCount}
          />
        ))}
      </div>
    </div>
  );
} 
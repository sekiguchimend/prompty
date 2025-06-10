import React from 'react';
import { useRouter } from 'next/router';

const CreatePostContent: React.FC = () => {
  const router = useRouter();

  // 既存のcreate-post.tsxページにリダイレクト
  React.useEffect(() => {
    router.push('/create-post');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <p>投稿ページにリダイレクト中...</p>
        </div>
      </div>
    </div>
  );
};

export const CreatePostMain: React.FC = () => {
  return <CreatePostContent />;
};
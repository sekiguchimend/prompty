import React from 'react';
import Link from 'next/link';
import { Button } from '../src/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold mb-2">404</h2>
        <h3 className="text-xl font-semibold mb-4">ページが見つかりません</h3>
        <p className="text-gray-600 mb-6">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link href="/">
          <Button className="bg-black text-white hover:bg-gray-800 transition-colors">
            ホームに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
} 
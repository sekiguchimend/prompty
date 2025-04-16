'use client';

import React from 'react';
import { Button } from '../src/components/ui/button';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
        <p className="text-gray-700 mb-6">申し訳ありませんが、ページの読み込み中にエラーが発生しました。</p>
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={reset}
            className="bg-black text-white hover:bg-gray-800 transition-colors"
          >
            再試行する
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
} 
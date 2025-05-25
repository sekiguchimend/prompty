import React from 'react';
import { ChevronRight } from 'lucide-react';

// 投稿モード選択プロップス型定義
interface PostModeSelectorProps {
  onSelectMode: (mode: 'standard' | 'step') => void;
}

const PostModeSelector: React.FC<PostModeSelectorProps> = ({ onSelectMode }) => {
  // モード選択時のハンドラー
  const handleSelectStep = () => {
    onSelectMode('step');
  };

  const handleSelectStandard = () => {
    onSelectMode('standard');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <h1 className="text-3xl font-bold mb-8 text-center">投稿方法を選択</h1>
      
      {/* タブスタイルのUI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ステップ投稿ボタン */}
        <div 
          onClick={handleSelectStep}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold mb-2">ステップ投稿</h3>
            <p className="text-gray-600 mb-4">一項目ずつガイド付きで入力できます。初めての方におすすめです。</p>
            <div className="mt-auto flex items-center text-green-600 font-medium">
              選択する <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </div>

        {/* 通常投稿ボタン */}
        <div 
          onClick={handleSelectStandard}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex flex-col items-start">
            <h3 className="text-xl font-bold mb-2">通常投稿</h3>
            <p className="text-gray-600 mb-4">一画面ですべての項目を入力できます。慣れた方向けです。</p>
            <div className="mt-auto flex items-center text-green-600 font-medium">
              選択する <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 mt-6">
        どちらの方法でも同じ内容を投稿できます。途中で切り替えることも可能です。
      </p>
    </div>
  );
};

export default PostModeSelector; 
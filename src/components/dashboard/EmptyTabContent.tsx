import React from 'react';
import { Inbox, FileQuestion, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

interface EmptyTabContentProps {
  tabName: string;
}

const EmptyTabContent: React.FC<EmptyTabContentProps> = ({ tabName }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-50 rounded-full">
            <FileQuestion className="h-12 w-12 text-indigo-500" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-3">
          まだ{tabName}がありません
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
          {tabName === 'コンテンツ' ? (
            <>
              プロンプトや記事を作成して、あなたのコンテンツを共有しましょう。
            </>
          ) : tabName === 'メンバーシップ' ? (
            <>
              メンバーシップを作成して、ファンとより深くつながりましょう。
            </>
          ) : tabName === 'マガジン' ? (
            <>
              マガジンを作成して、あなたのコンテンツをまとめましょう。
            </>
          ) : (
            <>
              このセクションには現在何もコンテンツがありません。新しいコンテンツを作成してみましょう。
            </>
          )}
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link to="/create-post">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              {tabName === 'コンテンツ' ? '新規作成' : 
                tabName === 'メンバーシップ' ? 'メンバーシップを作成' :
                tabName === 'マガジン' ? 'マガジンを作成' : '新規作成'}
            </Button>
          </Link>
          
          <a href="https://prompty.jp/help" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-lg border-gray-200">
              ヘルプを見る
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmptyTabContent; 
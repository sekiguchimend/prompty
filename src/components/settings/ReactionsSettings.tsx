import React from 'react';
import { Switch } from '../../components/ui/switch';

const ReactionsSettings: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">リアクション</h1>
      
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">リアクション設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメントを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたの記事やノートにコメントできなくなります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">いいねを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたの記事やノートにいいねできなくなります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">スキを許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、あなたの記事やノートをスキできなくなります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-4">コメント設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメントの承認制</span>
                <p className="text-xs text-gray-500 mt-1">
                  オンにすると、あなたの承認後にコメントが公開されます。
                </p>
              </div>
              <Switch />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメント通知</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、コメントの通知を受け取りません。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">コメント返信通知</span>
                <p className="text-xs text-gray-500 mt-1">
                  オフにすると、コメントへの返信の通知を受け取りません。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactionsSettings; 
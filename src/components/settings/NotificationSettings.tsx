import React from 'react';
import { Switch } from '../../components/ui/switch';

const NotificationSettings: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">通知</h1>
      
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">メール通知</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">記事やノートへのいいね</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">スキ</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">ニュースレター</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">プロモーション</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-4">プッシュ通知</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">フォローしているクリエイターの新着投稿</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">記事やノートへのいいね</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">コメント</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">メンション</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">フォロー</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">スキ</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings; 
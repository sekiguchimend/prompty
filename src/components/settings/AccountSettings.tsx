import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { ChevronRight } from 'lucide-react';

const AccountSettings: React.FC = () => {
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  
  // アカウント情報（実際の実装ではAPIから取得）
  const accountInfo = {
    creatorName: 'しゅんや@勤勉的なアプリ運営',
    noteId: 'rattt774',
    email: 'sekiguchishunya0619@outlook.jp',
  };
  
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">アカウント</h1>
      
      <div className="space-y-6">
        {/* クリエイター名 */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">クリエイター名</label>
              <div className="mt-1 text-sm">{accountInfo.creatorName}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* note ID */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">prompty ID</label>
              <div className="mt-1 text-sm">{accountInfo.noteId}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* メールアドレス */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
              <div className="mt-1 text-sm">{accountInfo.email}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* パスワード */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">パスワード</label>
              <div className="mt-1 text-sm">********</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 法人・個人としてnoteを利用する */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">法人・個人としてpromptyを利用する</label>
              <div className="mt-1 text-xs text-gray-500">企業や団体など、ビジネス目的でpromptyを利用される方はこちらをオンにしてください。<br />
              ビジネスでの機能強化に向けて準備を進めています。</div>
            </div>
            <Switch
              checked={isBusinessAccount}
              onCheckedChange={setIsBusinessAccount}
            />
          </div>
        </div>
        
        {/* インボイス発行事業者の登録番号 */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">インボイス発行事業者の登録番号</label>
              <div className="mt-1 text-sm">未登録</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">登録</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* ソーシャル連携 */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-4">ソーシャル連携</h2>
          
          {/* X (Twitter) */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                X
              </div>
              <span>X (Twitter)</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              連携
            </Button>
          </div>
          
          {/* Google */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4285F4"/>
                  <path d="M11 7H13V13H17V15H11V7Z" fill="#4285F4"/>
                </svg>
              </div>
              <span>Google</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              連携
            </Button>
          </div>
          
          {/* Apple */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.94 5.19C16.35 3.91 16.35 1.76 14.94 0.48C13.52 1.76 13.52 3.91 14.94 5.19ZM12 22.92C10.97 22.92 8.92 22.09 7.13 20.3C6.74 19.91 6.74 19.28 7.13 18.89C7.52 18.5 8.15 18.5 8.54 18.89C9.54 19.89 10.97 20.42 12 20.42C13.03 20.42 14.46 19.89 15.46 18.89C15.85 18.5 16.48 18.5 16.87 18.89C17.26 19.28 17.26 19.91 16.87 20.3C15.08 22.09 13.03 22.92 12 22.92ZM12 6.91C7.4 6.91 3.7 10.6 3.7 15.21C3.7 18.59 5.67 21.51 8.54 22.92C9.4 22.92 10.15 22.44 10.46 21.68C10.78 20.91 10.48 20.04 9.82 19.58C8.46 18.7 7.7 17.03 7.7 15.21C7.7 12.81 9.61 10.91 12 10.91C14.39 10.91 16.3 12.81 16.3 15.21C16.3 17.03 15.54 18.7 14.18 19.58C13.52 20.04 13.22 20.91 13.54 21.68C13.85 22.44 14.6 22.92 15.46 22.92C18.33 21.51 20.3 18.59 20.3 15.21C20.3 10.6 16.6 6.91 12 6.91Z" fill="white"/>
                </svg>
              </div>
              <span>Apple</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              連携
            </Button>
          </div>
          
          {/* オプション設定 */}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">クリエイターページにアカウントを表示</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">自分の記事がXでシェアされる際にメンションをつける</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        {/* 記事設定 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">記事設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">公式SNSでの紹介、外部サイトへの転載、他メディアへの紹介を許可する</span>
                <p className="text-xs text-gray-500 mt-1">
                 promptyが運営するXのSNSで紹介したり、SmartNewsやLINE NEWSなどの外部サイトへ転載したり、出版社に紹介したりすることがあります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">記事の下に他のクリエイターのおすすめ記事を表示する</span>
                <p className="text-xs text-gray-500 mt-1">
                  他のクリエイターとあなたの記事と相互に、読者が読む可能性が高まります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">記事を明朝体で表示する</span>
              <Switch />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">チップ機能を使った支払いを受け付ける</span>
                <p className="text-xs text-gray-500 mt-1">
                  prompty proを含め、すべての支払いを受け付けることができます。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">prompty未登録ユーザーの購入を許可する</span>
              <Switch defaultChecked />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">生成AIの学習に抵抗がある</span>
                <p className="text-xs text-gray-500 mt-1">
                  投稿したコンテンツを生成AIの学習データとして使用しないよう制限を設定します。
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
        
        {/* 退会手続きへボタン */}
        <div className="pt-4">
          <Button variant="link" className="text-gray-500 hover:text-gray-700 p-0">
            退会手続きへ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 
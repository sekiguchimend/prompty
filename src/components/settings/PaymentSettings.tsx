import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

const PaymentSettings: React.FC = () => {
  const [isAutoWithdrawal, setIsAutoWithdrawal] = useState(true);
  
  // 売上情報（サンプルデータ）
  const salesInfo = {
    currentBalance: 35800,
    nextPaymentDate: '2024年1月31日',
    lastPayment: {
      date: '2023年12月31日',
      amount: 28500
    }
  };
  
  // 銀行口座情報（サンプルデータ）
  const bankAccount = {
    bankName: 'プロンプト銀行',
    branchName: '渋谷支店',
    accountType: '普通',
    accountNumber: '1234567',
    accountHolder: 'ヤマダ タロウ'
  };
  
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">お支払先</h1>
      
      <div className="space-y-6">
        {/* 現在の売上 */}
        <div className="bg-green-50 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-2">現在の売上</h2>
          <p className="text-2xl font-bold text-green-600">{salesInfo.currentBalance.toLocaleString()}円</p>
          <p className="text-xs text-gray-600 mt-1">次回振込予定日: {salesInfo.nextPaymentDate}</p>
        </div>
        
        {/* 振込先口座 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">振込先口座</h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex">
                <span className="text-sm text-gray-600 w-24">金融機関:</span>
                <span className="text-sm">{bankAccount.bankName}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-600 w-24">支店名:</span>
                <span className="text-sm">{bankAccount.branchName}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-600 w-24">口座種別:</span>
                <span className="text-sm">{bankAccount.accountType}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-600 w-24">口座番号:</span>
                <span className="text-sm">{bankAccount.accountNumber}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-gray-600 w-24">口座名義:</span>
                <span className="text-sm">{bankAccount.accountHolder}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 振込設定 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">振込設定</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">自動振込</span>
                <p className="text-xs text-gray-500 mt-1">
                  オンにすると、売上が5,000円を超えた場合に自動的に振込されます。
                </p>
              </div>
              <Switch
                checked={isAutoWithdrawal}
                onCheckedChange={setIsAutoWithdrawal}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm">振込通知メール</span>
                <p className="text-xs text-gray-500 mt-1">
                  振込処理が完了した際にメールで通知を受け取ります。
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
        
        {/* 振込履歴 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">振込履歴</h2>
            <div className="text-xs text-gray-500">直近3ヶ月</div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">12月分売上</h3>
                  <p className="text-xs text-gray-500 mt-1">{salesInfo.lastPayment.date}</p>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {salesInfo.lastPayment.amount.toLocaleString()}円
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">11月分売上</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年11月30日</p>
                </div>
                <div className="text-sm font-medium text-green-600">
                  22,300円
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">10月分売上</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年10月31日</p>
                </div>
                <div className="text-sm font-medium text-green-600">
                  19,800円
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Button variant="outline" className="rounded-full text-sm px-6">
              もっと見る <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* 収入証明書 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">収入証明書</h2>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm">収入証明書を発行できます</p>
              <p className="text-xs text-gray-500 mt-1">
                確定申告などに利用できる収入証明書を発行できます。年度を指定して発行可能です。
              </p>
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              証明書を発行
            </Button>
          </div>
        </div>
        
        {/* 税務情報 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">税務情報</h2>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm">インボイス制度登録番号</h3>
                <p className="text-xs text-gray-500 mt-1">
                  未登録
                </p>
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
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings; 
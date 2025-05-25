import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

const PaymentSettings: React.FC = () => {
  const [isAutoWithdrawal, setIsAutoWithdrawal] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountHolder: ''
  });
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBankFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、ここでAPIに登録情報を送信する処理を追加
    console.log('送信された銀行口座情報:', bankFormData);
    // フォームを閉じる
    setShowBankForm(false);
    // 成功メッセージなどを表示
    alert('銀行口座情報が更新されました');
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
              onClick={() => setShowBankForm(!showBankForm)}
            >
              <span className="mr-1">変更</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {!showBankForm ? (
            // 既存の口座情報表示
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
          ) : (
            // 銀行口座登録フォーム
            <div className="border border-gray-200 rounded-lg p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">金融機関名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="bankName"
                    value={bankFormData.bankName}
                    onChange={handleInputChange}
                    placeholder="例: 〇〇銀行"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">支店名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="branchName"
                    value={bankFormData.branchName}
                    onChange={handleInputChange}
                    placeholder="例: 渋谷支店"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">口座種別 <span className="text-red-500">*</span></label>
                  <select
                    name="accountType"
                    value={bankFormData.accountType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  >
                    <option value="普通">普通</option>
                    <option value="当座">当座</option>
                    <option value="貯蓄">貯蓄</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">口座番号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankFormData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="例: 1234567"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    pattern="\d{7}"
                    title="7桁の数字を入力してください"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">7桁の数字を入力してください</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-1">口座名義（カタカナ） <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={bankFormData.accountHolder}
                    onChange={handleInputChange}
                    placeholder="例: ヤマダ タロウ"
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">全角カタカナで入力してください（姓と名の間にスペース）</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBankForm(false)}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    type="submit" 
                    variant="default" 
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    保存する
                  </Button>
                </div>
              </form>
            </div>
          )}
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
            <div className="flex space-x-2 items-center">
              <select 
                className="text-xs border border-gray-300 rounded-md p-1" 
                defaultValue="3months"
              >
                <option value="3months">直近3ヶ月</option>
                <option value="6months">直近6ヶ月</option>
                <option value="1year">直近1年</option>
                <option value="all">すべて</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex items-center"
                onClick={() => alert('CSVがダウンロードされました')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </Button>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取引日</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">明細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">{salesInfo.lastPayment.date}</td>
                  <td className="px-4 py-3">12月分売上</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">{salesInfo.lastPayment.amount.toLocaleString()}円</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1 h-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">2023年11月30日</td>
                  <td className="px-4 py-3">11月分売上</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">22,300円</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1 h-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">2023年10月31日</td>
                  <td className="px-4 py-3">10月分売上</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">19,800円</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1 h-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">2023年9月30日</td>
                  <td className="px-4 py-3">9月分売上</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">15,600円</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1 h-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-gray-500">全12件中 1-4件を表示</div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                <span className="sr-only">前へ</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-gray-100">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">3</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">次へ</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Button>
            </div>
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
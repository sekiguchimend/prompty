import React from 'react';
import { Button } from '../../components/ui/button';
import { ChevronRight, Trash2 } from 'lucide-react';

// サンプルのカード情報データ
const cardData = [
  {
    id: '1',
    type: 'visa',
    number: '****1234',
    expiry: '12/25',
    isDefault: true
  },
  {
    id: '2',
    type: 'mastercard',
    number: '****5678',
    expiry: '03/26',
    isDefault: false
  }
];

const CardSettings: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">カード情報</h1>
      
      <div className="space-y-6">
        {/* カード一覧 */}
        <div className="space-y-4">
          {cardData.map(card => (
            <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-12 h-8 ${card.type === 'visa' ? 'bg-blue-600' : 'bg-orange-600'} rounded-md mr-4 flex items-center justify-center text-white text-xs font-bold`}>
                    {card.type === 'visa' ? 'VISA' : 'MC'}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-sm">
                        {card.type === 'visa' ? 'Visa' : 'Mastercard'} {card.number}
                      </h3>
                      {card.isDefault && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                          デフォルト
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">有効期限: {card.expiry}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!card.isDefault && (
                    <Button variant="outline" size="sm" className="text-xs">
                      デフォルトにする
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* カード追加ボタン */}
        <div>
          <Button variant="outline" className="w-full">
            カードを追加
          </Button>
        </div>
        
        {/* 請求先住所 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">請求先住所</h2>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm">〒123-4567</p>
                <p className="text-sm">東京都渋谷区渋谷1-2-3</p>
                <p className="text-sm">プロンプティビル 301号室</p>
                <p className="text-sm mt-2">山田 太郎</p>
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
        </div>
        
        {/* 支払い履歴 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">支払い履歴</h2>
            <div className="text-xs text-gray-500">直近3ヶ月</div>
          </div>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">プレミアム会員費（月額）</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年12月25日</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-6 h-4 bg-blue-600 rounded-sm mr-2 flex items-center justify-center text-white text-xs font-bold">
                      V
                    </div>
                    <span className="text-xs">****1234</span>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  980円
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">プレミアム会員費（月額）</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年11月25日</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-6 h-4 bg-blue-600 rounded-sm mr-2 flex items-center justify-center text-white text-xs font-bold">
                      V
                    </div>
                    <span className="text-xs">****1234</span>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  980円
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
        
        {/* 明細書 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">明細書</h2>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm">支払い明細を発行できます</p>
              <p className="text-xs text-gray-500 mt-1">
                指定した期間の支払い履歴をまとめて明細書として発行できます。
              </p>
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              明細書を発行
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSettings; 
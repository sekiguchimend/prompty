import React from 'react';
import { Button } from '../../components/ui/button';
import { ChevronRight } from 'lucide-react';

// サンプルの購入履歴データ
const purchaseHistory = [
  {
    id: '1',
    title: 'プレミアム会員費（月額）',
    date: '2023年12月25日',
    amount: '980円',
    status: '決済完了'
  },
  {
    id: '2',
    title: '有料コンテンツ「副業のはじめ方」',
    author: '副業マスター',
    date: '2023年12月20日',
    amount: '500円',
    status: '決済完了'
  },
  {
    id: '3',
    title: 'チップ - 「AIツール活用術」',
    author: 'テクノロジスト',
    date: '2023年12月15日',
    amount: '300円',
    status: '決済完了'
  }
];

const PurchaseSettings: React.FC = () => {
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">購入・チップ履歴</h1>
      
      <div className="space-y-6">
        {/* 購入履歴一覧 */}
        <div className="space-y-4">
          {purchaseHistory.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  {item.author && (
                    <p className="text-xs text-gray-500 mt-1">作者: {item.author}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  <div className="mt-2 text-sm font-medium">{item.amount}</div>
                </div>
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* もっと見るボタン */}
        <div className="text-center">
          <Button variant="outline" className="rounded-full text-sm px-6">
            もっと見る <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSettings; 
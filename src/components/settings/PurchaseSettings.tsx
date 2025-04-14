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
        
        {/* 領収書発行 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">領収書発行</h2>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm">すべての購入履歴の領収書を発行できます</p>
              <p className="text-xs text-gray-500 mt-1">
                指定した期間の購入履歴をまとめて領収書として発行できます。
              </p>
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              領収書を発行
            </Button>
          </div>
        </div>
        
        {/* 支払い方法 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">支払い方法</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-6 bg-blue-500 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="text-sm font-medium">クレジットカード (VISA ****1234)</p>
                  <p className="text-xs text-gray-500">有効期限: 2025年12月</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs mr-2">
                  デフォルト
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-6 bg-orange-500 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                  MC
                </div>
                <div>
                  <p className="text-sm font-medium">クレジットカード (Mastercard ****5678)</p>
                  <p className="text-xs text-gray-500">有効期限: 2026年3月</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              支払い方法を追加
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSettings; 
import React from 'react';
import { Button } from '../../components/ui/button';
import { ChevronRight } from 'lucide-react';

// サンプルのポイント履歴データ
const pointsHistory = [
  {
    id: '1',
    title: '記事「AIプロンプトエンジニアリング入門」購入',
    date: '2023年12月15日',
    points: '-500',
    type: '支出'
  },
  {
    id: '2',
    title: '月間ログインボーナス',
    date: '2023年12月1日',
    points: '+300',
    type: '獲得'
  },
  {
    id: '3',
    title: 'コメント投稿報酬',
    date: '2023年11月28日',
    points: '+50',
    type: '獲得'
  }
];

const PointsSettings: React.FC = () => {
  // 現在のポイント（実際の実装ではAPIから取得）
  const currentPoints = 1850;
  
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">ポイント管理</h1>
      
      <div className="space-y-6">
        {/* 現在のポイント */}
        <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium text-gray-700">現在のポイント</h2>
            <p className="text-2xl font-bold text-blue-600 mt-1">{currentPoints} pt</p>
          </div>
          <Button variant="outline" className="whitespace-nowrap">
            ポイントを購入
          </Button>
        </div>
        
        {/* ポイント履歴 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">ポイント履歴</h2>
            <div className="text-xs text-gray-500">直近3ヶ月</div>
          </div>
          
          <div className="space-y-4">
            {pointsHistory.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  </div>
                  <div className={`text-sm font-medium ${item.type === '獲得' ? 'text-green-600' : 'text-red-600'}`}>
                    {item.points} pt
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-4">
            <Button variant="outline" className="rounded-full text-sm px-6">
              もっと見る <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* ポイント獲得方法 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">ポイント獲得方法</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">デイリーログイン</h3>
              <p className="text-xs text-gray-600 mb-2">毎日のログインで10ポイント獲得できます。連続ログインでボーナスポイントも！</p>
              <div className="text-sm font-medium text-green-600">+10〜50 pt</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">コメント投稿</h3>
              <p className="text-xs text-gray-600 mb-2">他の記事へのコメントでポイントが貯まります。</p>
              <div className="text-sm font-medium text-green-600">+5 pt / コメント</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">コンテンツ執筆</h3>
              <p className="text-xs text-gray-600 mb-2">コンテンツを投稿するとポイントが獲得できます。</p>
              <div className="text-sm font-medium text-green-600">+50 pt / コンテンツ</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">友達招待</h3>
              <p className="text-xs text-gray-600 mb-2">招待した友達が登録すると両方にポイントがもらえます。</p>
              <div className="text-sm font-medium text-green-600">+100 pt / 人</div>
            </div>
          </div>
        </div>
        
        {/* ポイント利用方法 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">ポイント利用方法</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">有料コンテンツの購入</h3>
              <p className="text-xs text-gray-600 mb-2">ポイントを使って有料コンテンツを購入できます。</p>
              <div className="text-sm font-medium text-red-600">コンテンツ価格分</div>
            </div>
            
        
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">AIプロンプト生成</h3>
              <p className="text-xs text-gray-600 mb-2">高品質なAIプロンプトの生成に利用できます。</p>
              <div className="text-sm font-medium text-red-600">50〜200 pt / 生成</div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-medium text-sm mb-2">デジタルアイテム交換</h3>
              <p className="text-xs text-gray-600 mb-2">プロフィールアイテムやスタンプと交換できます。</p>
              <div className="text-sm font-medium text-red-600">100〜1000 pt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsSettings; 
import React from 'react';
import { Button } from '../../components/ui/button';
import { Check, X } from 'lucide-react';

const PremiumSettings: React.FC = () => {
  // プレミアム会員情報（サンプルデータ）
  const premiumInfo = {
    isSubscribed: true,
    plan: '月額プラン',
    startDate: '2023年10月15日',
    nextBillingDate: '2024年1月15日',
    price: '980'
  };
  
  // プレミアムプランの特典
  const premiumBenefits = [
    '有料記事の作成（月5記事まで）',
    'AI生成プロンプトの利用（月50回まで）',
    '限定コミュニティへのアクセス',
    'プレミアムバッジの表示',
    '広告の非表示',
    '優先サポート'
  ];
  
  // スタンダードプランとの比較
  const planComparison = [
    { 
      feature: '有料コンテンツ作成', 
      standard: '月2記事まで', 
      premium: '月5記事まで' 
    },
    { 
      feature: 'AI生成プロンプト', 
      standard: '月10回まで', 
      premium: '月50回まで' 
    },
    { 
      feature: '限定コミュニティ', 
      standard: false, 
      premium: true 
    },
    { 
      feature: 'プレミアムバッジ', 
      standard: false, 
      premium: true 
    },
    { 
      feature: '広告非表示', 
      standard: false, 
      premium: true 
    },
    { 
      feature: '優先サポート', 
      standard: false, 
      premium: true 
    }
  ];
  
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">プレミアム</h1>
      
      <div className="space-y-6">
        {/* 現在の契約状況 */}
        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium mb-3">
                現在の契約状況
              </div>
              <h2 className="text-lg font-bold">{premiumInfo.plan}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {premiumInfo.startDate}から利用中
              </p>
              <p className="text-sm text-gray-600">
                次回請求日: {premiumInfo.nextBillingDate}
              </p>
              <p className="text-sm font-medium mt-2">
                月額 {premiumInfo.price}円（税込）
              </p>
            </div>
            
            <Button variant="outline" className="bg-white">
              プランを変更
            </Button>
          </div>
          
          <div className="border-t border-purple-100 mt-4 pt-4">
            <h3 className="text-sm font-medium mb-2">プレミアム特典</h3>
            <ul className="space-y-1">
              {premiumBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* プラン比較 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">プラン比較</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/3">
                    機能
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/3">
                    スタンダード
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-1/3">
                    プレミアム
                  </th>
                </tr>
              </thead>
              <tbody>
                {planComparison.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 text-sm border-b border-gray-200">
                      {item.feature}
                    </td>
                    <td className="py-3 px-4 text-sm border-b border-gray-200">
                      {typeof item.standard === 'boolean' ? (
                        item.standard ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )
                      ) : (
                        item.standard
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm border-b border-gray-200">
                      {typeof item.premium === 'boolean' ? (
                        item.premium ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )
                      ) : (
                        <span className="font-medium text-purple-600">{item.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium border-b border-gray-200">
                    価格
                  </td>
                  <td className="py-3 px-4 text-sm border-b border-gray-200">
                    無料
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-purple-600 border-b border-gray-200">
                    月額980円（税込）
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 請求履歴 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">請求履歴</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm">2023年12月分</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年12月15日</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-4">980円</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    領収書
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm">2023年11月分</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年11月15日</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-4">980円</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    領収書
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-sm">2023年10月分</h3>
                  <p className="text-xs text-gray-500 mt-1">2023年10月15日</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-4">980円</span>
                  <Button variant="outline" size="sm" className="text-xs">
                    領収書
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 解約 */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">解約</h2>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-3">
              プレミアムプランをキャンセルすると、次回の請求日以降は課金されません。現在の期間が終了するまではプレミアム特典をご利用いただけます。
            </p>
            <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
              プランをキャンセル
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSettings; 
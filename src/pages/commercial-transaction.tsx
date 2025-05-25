import React from 'react';
import Footer from '../components/footer';
// import { Helmet } from 'react-helmet';

const CommercialTransaction: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* <Helmet>
        <title>特定商取引法に基づく表示 | prompty</title>
      </Helmet> */}
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">特定商取引法に基づく表示</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-10">
            <table className="w-full border-collapse">
              <tbody className="divide-y">
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50">販売事業者</th>
                  <td className="py-4 px-4">Queue株式会社</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">住所</th>
                  <td className="py-4 px-4">〒104-0061<br />東京都中央区銀座８丁目17-5<br />THE HUB 銀座 OCT nex Inc.</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">連絡先</th>
                  <td className="py-4 px-4">
                    <p>メールアドレス: queue@queuetech.jp</p>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">サービス名</th>
                  <td className="py-4 px-4">prompty</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">販売価格</th>
                  <td className="py-4 px-4">各商品・サービスページをご確認ください</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">支払方法</th>
                  <td className="py-4 px-4">クレジットカード決済</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">商品の引渡し時期</th>
                  <td className="py-4 px-4">お支払い完了後、即時</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">返品・キャンセル</th>
                  <td className="py-4 px-4">デジタルコンテンツのため、購入後の返品・キャンセルは原則としてお受けしておりません</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommercialTransaction;

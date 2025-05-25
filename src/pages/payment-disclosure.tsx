import React from 'react';
import Footer from '../components/footer';
import Head from 'next/head';
import { ChevronLeft } from 'lucide-react';

const PaymentDisclosure: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>資金決済法に基づく表示 | prompty</title>
      </Head>
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">資金決済法に基づく表示</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-10">
            <h2 className="text-xl font-semibold mb-6">通常ポイントに関する表示</h2>
            
            <table className="w-full border-collapse">
              <tbody className="divide-y">
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50">発行者</th>
                  <td className="py-4 px-4">Queue株式会社</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイントの名称</th>
                  <td className="py-4 px-4">promptyポイント</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイントの価値</th>
                  <td className="py-4 px-4">1ポイント = 1円相当</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイントの利用方法</th>
                  <td className="py-4 px-4">
                    <ul className="list-disc pl-6 space-y-1">
                      <li>prompty内のプロンプト購入</li>
                      <li>プレミアム会員費の支払い</li>
                      <li>その他当社が定めるサービスでの利用</li>
                    </ul>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">有効期限</th>
                  <td className="py-4 px-4">最終利用日から1年間</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイント取得方法</th>
                  <td className="py-4 px-4">
                    <ul className="list-disc pl-6 space-y-1">
                      <li>クレジットカードによる購入</li>
                      <li>プレミアム会員特典としての付与</li>
                      <li>キャンペーンによる付与</li>
                    </ul>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイント残高・履歴の確認方法</th>
                  <td className="py-4 px-4">ユーザーアカウントページの「ポイント履歴」から確認可能</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">ポイント交換の可否</th>
                  <td className="py-4 px-4">他社ポイントへの交換、現金への換金はできません</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">未使用ポイントの払戻条件</th>
                  <td className="py-4 px-4">
                    <p>当社が本サービスを終了する場合は、事前に告知の上、未使用ポイントに相当する金額を払い戻します。</p>
                    <p className="mt-2">お客様都合による払戻しは原則としてお受けしておりません。</p>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50">苦情・相談窓口</th>
                  <td className="py-4 px-4">
                    <p>メールアドレス: queue@queuetech.jp</p>
                    <p className="mt-2">受付時間: 平日10:00〜18:00（土日祝日・年末年始を除く）</p>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-8">
              <h3 className="font-semibold mb-2">第三者型発行者の基準日及び基準額</h3>
              <p className="text-gray-700">
                基準日: 毎年3月末日および9月末日<br />
                直近基準日: 2025年3月31日<br />
                未使用発行ポイント額: 10,000,000円<br />
                資産保全措置を講じている金額: 11,000,000円
              </p>
            </div>
            
            <p className="text-right text-sm text-gray-500 mt-8">
              更新日: 2025年4月11日
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentDisclosure;

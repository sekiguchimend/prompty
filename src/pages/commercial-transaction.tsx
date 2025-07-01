import React from 'react';
import Footer from '../components/footer';
import Head from 'next/head';

const CommercialTransaction: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>特定商取引法に基づく表示 | prompty</title>
      </Head>
      <main className="flex-1 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">特定商取引法に基づく表示</h1>
          
          <div className="bg-white p-8 rounded-lg shadow-sm space-y-8">
            
            {/* プラットフォーム運営者情報 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">プラットフォーム運営者情報</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        販売業者
                      </th>
                      <td className="py-4 px-4">Queue株式会社</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        代表者
                      </th>
                      <td className="py-4 px-4">代表取締役 [代表者名]</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        所在地
                      </th>
                      <td className="py-4 px-4">
                        〒104-0061<br />
                        東京都中央区銀座8丁目17-5<br />
                        THE HUB 銀座 OCT nex Inc.
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        電話番号
                      </th>
                      <td className="py-4 px-4">
                        [電話番号]<br />
                        <span className="text-sm text-gray-600">※お問い合わせは原則メールにて承っております</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        メールアドレス
                      </th>
                      <td className="py-4 px-4">support@prompty-ai.com</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        事業内容
                      </th>
                      <td className="py-4 px-4">
                        AIプロンプト売買プラットフォーム「prompty」の運営<br />
                        （C2C取引の仲介・決済代行サービス）
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        古物商許可
                      </th>
                      <td className="py-4 px-4">
                        [古物商許可番号]<br />
                        <span className="text-sm text-gray-600">※デジタルコンテンツの性質上、古物営業法の対象外</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* サービス概要 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">サービス概要</h2>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="text-gray-800 mb-4">
                  <strong>prompty</strong>は、個人間（C2C）でAIプロンプトを売買できるプラットフォームです。
                </p>
                <div className="space-y-2 text-sm">
                  <p>• <strong>売買契約</strong>：販売者（出品者）と購入者の間で直接成立</p>
                  <p>• <strong>当社の役割</strong>：取引の仲介、決済代行、プラットフォーム提供</p>
                  <p>• <strong>責任範囲</strong>：当社は売買契約の当事者ではありません</p>
                </div>
              </div>
            </section>

            {/* 商品・サービス詳細 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">商品・サービス詳細</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        販売商品
                      </th>
                      <td className="py-4 px-4">
                        AIプロンプト（AI への指示文・入力文及びその関連素材）<br />
                        <span className="text-sm text-gray-600">※デジタルコンテンツ</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        販売価格
                      </th>
                      <td className="py-4 px-4">
                        各商品ページに表示される価格<br />
                        <strong>価格範囲</strong>：100円 〜 50,000円（税込）<br />
                        <span className="text-sm text-gray-600">※販売者が個別に設定</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        販売者
                      </th>
                      <td className="py-4 px-4">
                        本プラットフォームに登録した個人・法人<br />
                        <span className="text-sm text-gray-600">※当社ではなく、各出品者が販売主体です</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        商品の性質
                      </th>
                      <td className="py-4 px-4">
                        • 無形のデジタルコンテンツ<br />
                        • ダウンロード・閲覧形式で提供<br />
                        • 購入者の商用利用可能（再販売は禁止）
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 決済・手数料 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">決済・手数料</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        支払方法
                      </th>
                      <td className="py-4 px-4">
                        クレジットカード決済（Stripe Inc. 提供）<br />
                        <span className="text-sm text-gray-600">対応カード：VISA、MasterCard、JCB、American Express等</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        支払時期
                      </th>
                      <td className="py-4 px-4">購入手続き完了時（即時決済）</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        プラットフォーム手数料
                      </th>
                      <td className="py-4 px-4">
                        <strong>販売者負担</strong>：<br />
                        • 販売手数料：売上金額の10%（税込）<br />
                        • 決済手数料：売上金額の3.6%（税込）<br />
                        <span className="text-sm text-gray-600">※売上金額から自動控除し、残額を販売者に支払い</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        購入者負担
                      </th>
                      <td className="py-4 px-4">
                        表示価格のみ（追加手数料なし）<br />
                        <span className="text-sm text-gray-600">※クレジットカード会社の分割手数料等は除く</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 商品引渡し・キャンセル */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">商品引渡し・キャンセル</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        商品の引渡し時期
                      </th>
                      <td className="py-4 px-4">
                        決済完了後、即時（24時間365日）<br />
                        <span className="text-sm text-gray-600">※システム障害等の場合を除く</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        引渡し方法
                      </th>
                      <td className="py-4 px-4">
                        プラットフォーム上での閲覧・ダウンロード<br />
                        購入後、マイページから永続的にアクセス可能
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        返品・キャンセル
                      </th>
                      <td className="py-4 px-4">
                        <strong>原則不可</strong><br />
                        デジタルコンテンツの性質上、購入後の返品・キャンセルは原則としてお受けしておりません。<br /><br />
                        <strong>例外的対応</strong>：<br />
                        • 商品説明と著しく異なる場合<br />
                        • 技術的不具合により閲覧不可能な場合<br />
                        • 販売者による重大な虚偽記載があった場合<br />
                        <span className="text-sm text-gray-600">※当社判断により個別対応</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 責任・保証 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">責任・保証</h2>
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="font-medium mb-3">重要なお知らせ</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>商品の品質・内容</strong>：販売者が責任を負います。当社は内容の正確性・有用性を保証いたしません。
                  </p>
                  <p>
                    <strong>知的財産権</strong>：販売者が必要な権利を有していることを前提としています。権利侵害があった場合の責任は販売者が負います。
                  </p>
                  <p>
                    <strong>取引トラブル</strong>：当事者間での解決を原則とし、当社は仲裁・調停を行いますが、最終的な責任は負いません。
                  </p>
                  <p>
                    <strong>システム障害</strong>：不可抗力による障害の場合、当社の責任は限定されます。
                  </p>
                </div>
              </div>
            </section>

            {/* 苦情・問い合わせ */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">苦情・お問い合わせ</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left w-1/3 align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        お問い合わせ窓口
                      </th>
                      <td className="py-4 px-4">
                        <strong>Queue株式会社 カスタマーサポート</strong><br />
                        メール：support@prompty-ai.com<br />
                        受付時間：平日 10:00-18:00（土日祝日・年末年始除く）
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        対応内容
                      </th>
                      <td className="py-4 px-4">
                        • サービス利用方法のご案内<br />
                        • 取引トラブルの相談・仲裁<br />
                        • 技術的な不具合の対応<br />
                        • その他サービスに関するお問い合わせ
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-4 text-left align-top text-gray-700 bg-gray-50 border-r border-gray-300">
                        外部相談窓口
                      </th>
                      <td className="py-4 px-4">
                        <strong>消費者ホットライン</strong><br />
                        電話：188（いやや！）<br />
                        最寄りの消費生活センター等をご案内する全国共通の3桁の電話番号
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* その他 */}
            <section>
              <h2 className="text-xl font-semibold mb-6 text-blue-600">その他</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-medium mb-2">関連法令の遵守</h3>
                  <p className="text-sm">
                    当社は、特定商取引法、個人情報保護法、資金決済法、犯罪による収益の移転防止に関する法律等の関連法令を遵守してサービスを運営しております。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">管轄裁判所</h3>
                  <p className="text-sm">
                    本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">準拠法</h3>
                  <p className="text-sm">
                    本表示の解釈及び適用については、日本法に準拠するものとします。
                  </p>
                </div>
              </div>
            </section>
            
            <div className="border-t pt-6">
              <p className="text-right text-sm text-gray-500">
                制定日: 2025年7月1日<br />
                最終更新日: 2025年7月1日<br />
                Queue株式会社
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommercialTransaction;

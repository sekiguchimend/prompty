import React from 'react';
import Footer from '../components/footer';
import Head from 'next/head';
import { ChevronLeft } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>ご利用規約 | prompty</title>
      </Head>
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">ご利用規約</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">第1条（適用範囲）</h2>
              <p className="text-gray-700">
                本規約は、Queue株式会社（以下「当社」）が提供するサービス「prompty」（以下「本サービス」）の利用に関する条件を定めるものであり、本サービスを利用するすべてのユーザー（以下「ユーザー」）に適用されます。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第2条（利用登録）</h2>
              <p className="text-gray-700">
                1. 本サービスの利用を希望する者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。<br />
                2. 当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li>虚偽の情報を提供した場合</li>
                <li>過去に本規約に違反したことがある場合</li>
                <li>その他、当社が利用登録を適当でないと判断した場合</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <p className="text-gray-700">
                1. ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを管理するものとします。<br />
                2. ユーザーID及びパスワードの管理不十分、使用上の過誤、第三者の使用等による損害の責任はユーザーが負うものとし、当社は一切の責任を負いません。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第4条（禁止事項）</h2>
              <p className="text-gray-700 mb-4">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社または第三者の知的財産権、肖像権、プライバシー、名誉、その他の権利または利益を侵害する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>他のユーザーに対する嫌がらせや誹謗中傷</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第5条（サービスの停止・中断）</h2>
              <p className="text-gray-700">
                当社は、以下の事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することがあります。
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第6条（利用制限および登録抹消）</h2>
              <p className="text-gray-700">
                1. 当社は、以下の場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。<br />
                2. 本規約のいずれかの条項に違反した場合<br />
                3. その他、当社が本サービスの利用を適当でないと判断した場合
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第7条（免責事項）</h2>
              <p className="text-gray-700">
                1. 当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。<br />
                2. 当社は、本サービスの内容変更、中断、終了によって生じたいかなる損害についても、一切責任を負いません。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第8条（サービス内容の変更等）</h2>
              <p className="text-gray-700">
                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第9条（利用規約の変更）</h2>
              <p className="text-gray-700">
                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本ウェブサイトに掲載された時点から効力を生じるものとします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第10条（準拠法・裁判管轄）</h2>
              <p className="text-gray-700">
                1. 本規約の解釈にあたっては、日本法を準拠法とします。<br />
                2. 本サービスに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>
            
            <p className="text-right text-sm text-gray-500">
              制定日: 2025年1月21日<br />
              最終更新日: 2025年1月21日
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;

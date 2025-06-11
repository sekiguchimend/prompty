import React from 'react';
import Footer from '../components/footer';
import Head from 'next/head';
import { ChevronLeft } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Head>
        <title>プライバシーポリシー | prompty</title>
      </Head>
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. はじめに</h2>
              <p className="text-gray-700">
                Queue株式会社（以下「当社」）は、prompty（以下「本サービス」）の提供にあたり、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">2. 収集する情報</h2>
              <p className="text-gray-700 mb-4">
                当社は、以下の情報を収集する場合があります：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>氏名、メールアドレス、ユーザーID等の個人情報</li>
                <li>利用履歴、閲覧履歴、購入履歴等のサービス利用情報</li>
                <li>IPアドレス、ブラウザの種類、デバイス情報等の技術情報</li>
                <li>アンケートやフィードバックを通じて提供された情報</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">3. 情報の利用目的</h2>
              <p className="text-gray-700 mb-4">
                収集した情報は、以下の目的で利用します：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>本サービスの提供・運営・改善</li>
                <li>ユーザー認証、アカウント管理</li>
                <li>カスタマーサポートの提供</li>
                <li>利用状況の分析、新機能の開発</li>
                <li>マーケティング活動、プロモーションの実施</li>
                <li>不正利用の防止、セキュリティの確保</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">4. 情報の第三者提供</h2>
              <p className="text-gray-700 mb-4">
                当社は、以下の場合を除き、収集した個人情報を第三者に提供しません：
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>ユーザーの同意を得た場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                <li>業務委託先に対して、業務の遂行に必要な範囲で提供する場合</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">5. セキュリティ</h2>
              <p className="text-gray-700">
                当社は、収集した個人情報の漏洩、紛失、改ざん等を防止するために、適切なセキュリティ対策を講じます。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">6. プライバシーポリシーの変更</h2>
              <p className="text-gray-700">
                当社は、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">7. お問い合わせ</h2>
              <p className="text-gray-700">
                本プライバシーポリシーに関するお問い合わせは、以下の連絡先までお願いします。<br />
                メールアドレス: queue@queuetech.jp
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

export default Privacy;

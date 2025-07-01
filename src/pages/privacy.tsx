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
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
          
          <div className="bg-white p-8 rounded-lg shadow-sm space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第1条（事業者情報・個人情報保護管理者）</h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>事業者名</strong>：Queue株式会社</p>
                  <p><strong>代表者</strong>：代表取締役 [代表者名]</p>
                  <p><strong>住所</strong>：[会社住所]</p>
                  <p><strong>個人情報保護管理者</strong>：[管理者名・部署名]</p>
                  <p><strong>お問い合わせ</strong>：support@prompty-ai.com</p>
                </div>
                <p>Queue株式会社（以下「当社」）は、AIプロンプト売買プラットフォーム「prompty」（以下「本サービス」）において取得する個人情報について、個人情報保護法その他関連法令を遵守し、以下のとおりプライバシーポリシーを定めます。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第2条（収集する個人情報の項目）</h2>
              <div className="space-y-4 text-gray-700">
                <p>当社は、本サービスの提供にあたり、以下の個人情報を収集します。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【必須情報】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>氏名、メールアドレス</li>
                    <li>ユーザーID、パスワード（暗号化保存）</li>
                    <li>プロフィール情報（表示名、自己紹介等）</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【販売者登録時の追加情報】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>本人確認書類（運転免許証、パスポート等）</li>
                    <li>金融機関口座情報（決済用）</li>
                    <li>事業者の場合：商号、住所、代表者名</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【自動取得情報】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IPアドレス、デバイス情報、ブラウザ情報</li>
                    <li>アクセスログ、利用履歴、閲覧履歴</li>
                    <li>Cookie、セッション情報</li>
                    <li>購入・販売履歴、取引情報</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【任意提供情報】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>お問い合わせ内容</li>
                    <li>アンケート回答、フィードバック</li>
                    <li>SNS連携情報（OAuth認証時）</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第3条（個人情報の利用目的）</h2>
              <div className="space-y-3 text-gray-700">
                <p>当社は、収集した個人情報を以下の目的で利用します。</p>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-2">【サービス提供関連】</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>本サービスの提供、運営、維持</li>
                      <li>ユーザー認証、アカウント管理</li>
                      <li>コンテンツの配信、検索結果の表示</li>
                      <li>カスタマーサポート、お問い合わせ対応</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">【決済・取引関連】</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>決済処理、売上金の送金</li>
                      <li>本人確認（犯罪収益移転防止法対応）</li>
                      <li>不正取引の検知・防止</li>
                      <li>税務・会計処理、取引記録の保管</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">【サービス改善・マーケティング】</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>サービスの分析、改善、新機能開発</li>
                      <li>利用動向の分析、統計データの作成</li>
                      <li>キャンペーン、プロモーションのご案内</li>
                      <li>重要なお知らせの配信</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">【法的対応・安全確保】</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>法令遵守、当局への報告</li>
                      <li>利用規約違反の調査・対応</li>
                      <li>紛争の解決、法的手続きへの対応</li>
                      <li>システムの安全性確保、セキュリティ対策</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第4条（第三者提供）</h2>
              <div className="space-y-4 text-gray-700">
                <p>当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【同意に基づく提供】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>取引相手との連絡に必要な最小限の情報（ユーザー名等）</li>
                    <li>SNS連携時の公開プロフィール情報</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【法令に基づく提供】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>裁判所、検察庁、警察等からの法的要請</li>
                    <li>犯罪収益移転防止法に基づく当局への報告</li>
                    <li>税務当局への法定調書の提出</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【緊急時の提供】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>生命、身体、財産の保護のため緊急に必要な場合</li>
                    <li>公衆衛生の向上、児童の健全育成のため必要な場合</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第5条（業務委託・外部サービス連携）</h2>
              <div className="space-y-4 text-gray-700">
                <p>当社は、本サービス提供のため、以下の外部事業者に個人情報の処理を委託しています。</p>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">【決済処理】</h3>
                    <p><strong>Stripe, Inc.</strong>（米国）</p>
                    <p>目的：クレジットカード決済、売上金送金</p>
                    <p>移転される情報：氏名、決済情報、取引履歴</p>
                    <p>詳細：<a href="https://stripe.com/jp/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">https://stripe.com/jp/privacy</a></p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">【データベース・認証】</h3>
                    <p><strong>Supabase, Inc.</strong>（米国）</p>
                    <p>目的：ユーザーデータの保存・管理、認証処理</p>
                    <p>移転される情報：アカウント情報、利用履歴</p>
                    <p>詳細：<a href="https://supabase.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a></p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">【アクセス解析】</h3>
                    <p><strong>Google LLC</strong>（米国）</p>
                    <p>目的：サイト利用状況の分析、改善</p>
                    <p>移転される情報：アクセスログ、行動履歴（匿名化）</p>
                    <p>詳細：<a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></p>
                  </div>
                </div>
                
                <p className="mt-4">これらの事業者は、適切なデータ保護規制（GDPR、CCPA等）に準拠しており、当社との間で適切な委託契約を締結しています。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第6条（安全管理措置）</h2>
              <div className="space-y-3 text-gray-700">
                <p>当社は、個人情報の漏洩、滅失、毀損の防止その他安全管理のため、以下の措置を講じています。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【技術的安全管理措置】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>SSL/TLS暗号化通信の実装</li>
                    <li>データベースの暗号化</li>
                    <li>アクセス制御、認証システムの導入</li>
                    <li>ファイアウォール、侵入検知システムの運用</li>
                    <li>定期的な脆弱性診断の実施</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【組織的安全管理措置】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>個人情報保護管理者の設置</li>
                    <li>従業員への定期的な教育・研修</li>
                    <li>個人情報取扱規程の策定・遵守</li>
                    <li>アクセス権限の定期的な見直し</li>
                    <li>インシデント対応手順の整備</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第7条（個人情報の開示・訂正・削除等の請求）</h2>
              <div className="space-y-4 text-gray-700">
                <p>ユーザーは、個人情報保護法に基づき、当社に対して以下の請求を行うことができます。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【請求できる内容】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>利用目的の通知</li>
                    <li>個人情報の開示</li>
                    <li>個人情報の訂正・追加・削除</li>
                    <li>個人情報の利用停止・消去</li>
                    <li>第三者提供の停止</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【請求方法】</h3>
                  <p><strong>お問い合わせ先</strong>：support@prompty-ai.com</p>
                  <p><strong>必要事項</strong>：氏名、メールアドレス、請求内容、本人確認書類</p>
                  <p><strong>対応期間</strong>：原則として7営業日以内にご回答いたします</p>
                  <p><strong>手数料</strong>：開示請求については、実費相当額（上限1,000円）を頂戴する場合があります</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p><strong>注意事項</strong>：法令の規定により、請求にお応えできない場合があります（他の個人の権利利益を害するおそれがある場合等）。</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第8条（Cookie・アクセス解析ツールの利用）</h2>
              <div className="space-y-4 text-gray-700">
                <p>本サービスでは、サービス改善・利便性向上のため、以下のツールを使用しています。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【Google Analytics】</h3>
                  <p>ウェブサイトの利用状況を分析するため、GoogleアナリティクスによりCookieを使用した情報収集を行っています。この機能はCookieを無効にすることで拒否できます。</p>
                  <p>詳細：<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Googleアナリティクス利用規約</a></p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【必須Cookie】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>認証状態の維持</li>
                    <li>ショッピングカート機能</li>
                    <li>セキュリティ確保</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">【Cookie無効化方法】</h3>
                  <p>ブラウザの設定により、Cookieの受け入れを拒否することができます。ただし、一部機能が利用できなくなる場合があります。</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第9条（個人情報の保管期間・削除）</h2>
              <div className="space-y-3 text-gray-700">
                <p>当社は、利用目的の達成に必要な期間に限り、個人情報を保管します。</p>
                
                <div>
                  <h3 className="font-medium mb-2">【標準保管期間】</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>アカウント情報</strong>：退会から1年間</li>
                    <li><strong>取引記録</strong>：取引完了から7年間（商法・税法要件）</li>
                    <li><strong>本人確認書類</strong>：取引終了から7年間（犯罪収益移転防止法要件）</li>
                    <li><strong>アクセスログ</strong>：取得から1年間</li>
                    <li><strong>お問い合わせ記録</strong>：対応完了から3年間</li>
                  </ul>
                </div>
                
                <p>保管期間経過後は、復元不可能な方法で安全に削除いたします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第10条（未成年者の個人情報）</h2>
              <div className="space-y-3 text-gray-700">
                <p>当社は、15歳未満の児童から個人情報を取得する場合、保護者の同意を得るものとします。</p>
                <p>18歳未満の方が決済機能を利用される場合は、保護者の同意が必要です。</p>
                <p>未成年者の個人情報について保護者から開示・削除等の請求があった場合、適切に対応いたします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第11条（個人情報の越境移転）</h2>
              <div className="space-y-3 text-gray-700">
                <p>本サービスでは、外部サービス利用により、一部の個人情報が以下の国・地域に移転されます。</p>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p><strong>移転先国</strong>：アメリカ合衆国</p>
                  <p><strong>法的根拠</strong>：移転先事業者の十分性認定・適切保護措置</p>
                  <p><strong>保護措置</strong>：標準契約条項（SCC）、認証取得済み事業者との契約</p>
                </div>
                
                <p>移転先事業者は、GDPR、CCPA等の厳格なデータ保護規制に準拠しており、日本と同等水準の保護措置を講じています。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第12条（プライバシーポリシーの変更）</h2>
              <div className="space-y-3 text-gray-700">
                <p>当社は、法令の改正やサービス内容の変更等により、本プライバシーポリシーを変更することがあります。</p>
                <p>重要な変更を行う場合は、実施の30日前までに本ウェブサイト上で告知し、ユーザーにメール等で通知いたします。</p>
                <p>変更後のプライバシーポリシーは、本ウェブサイトに掲載された日から効力を生じます。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第13条（お問い合わせ窓口）</h2>
              <div className="space-y-3 text-gray-700">
                <p>個人情報の取扱いに関するお問い合わせ、苦情は以下までご連絡ください。</p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Queue株式会社</strong></p>
                  <p><strong>個人情報保護窓口</strong></p>
                  <p><strong>メール</strong>：support@prompty-ai.com</p>
                  <p><strong>受付時間</strong>：平日10:00-18:00（土日祝日・年末年始除く）</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p><strong>個人情報保護委員会への相談</strong></p>
                  <p>当社の対応にご納得いただけない場合は、個人情報保護委員会の個人情報保護相談ダイヤルにご相談できます。</p>
                  <p>電話：03-6457-9849　受付時間：平日9:30-17:30</p>
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

export default Privacy;

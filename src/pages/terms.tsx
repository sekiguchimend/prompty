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
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">ご利用規約</h1>
          
          <div className="bg-white p-8 rounded-lg shadow-sm space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-4">第1条（定義）</h2>
              <div className="space-y-3 text-gray-700">
                <p>本規約において使用する用語の意味は、次のとおりとします。</p>
                <div className="space-y-2 pl-4">
                  <p>1. 「本サービス」とは、Queue株式会社（以下「当社」）が運営するAIプロンプト売買プラットフォーム「prompty」をいいます。</p>
                  <p>2. 「ユーザー」とは、本サービスを利用するすべての者をいいます。</p>
                  <p>3. 「販売者」とは、本サービスにおいてプロンプトを販売するユーザーをいいます。</p>
                  <p>4. 「購入者」とは、本サービスにおいてプロンプトを購入するユーザーをいいます。</p>
                  <p>5. 「プロンプト」とは、AI（人工知能）への指示文・入力文及びその関連素材をいいます。</p>
                  <p>6. 「売買契約」とは、販売者と購入者との間で成立するプロンプトの売買に関する契約をいいます。</p>
                  <p>7. 「決済代行サービス」とは、当社が提供する売買代金の授受を仲介するサービスをいいます。</p>
                  <p>8. 「本人確認」とは、犯罪による収益の移転防止に関する法律に基づく本人特定事項の確認をいいます。</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第2条（適用範囲・契約の成立）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 本規約は、本サービスの利用に関する条件を定めるものであり、ユーザーと当社との間の一切の関係に適用されます。</p>
                <p>2. ユーザーは、本サービスの利用開始時に本規約に同意したものとみなされます。</p>
                <p>3. 本規約と個別の利用契約等との間に齟齬がある場合、個別の利用契約等が優先するものとします。</p>
                <p>4. 未成年者が本サービスを利用する場合は、事前に親権者等の法定代理人の同意を得るものとします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第3条（利用登録・本人確認）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 本サービスの利用を希望する者は、当社の定める方法により利用登録を申請するものとします。</p>
                <p>2. 販売者として登録する場合、当社は本人確認書類の提出を求めることがあります。</p>
                <p>3. 当社は、以下に該当する場合、利用登録を承認しない場合があります。</p>
                <div className="pl-4 space-y-1">
                  <p>• 虚偽の情報を提供した場合</p>
                  <p>• 暴力団員等反社会的勢力に該当する場合</p>
                  <p>• 過去に本規約違反により利用制限を受けた場合</p>
                  <p>• 本人確認が完了しない場合</p>
                  <p>• その他当社が不適切と判断した場合</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第4条（売買契約・責任の所在）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. プロンプトの売買契約は、販売者と購入者との間で直接成立するものとし、当社は売買契約の当事者ではありません。</p>
                <p>2. 当社は、プロンプトの内容、品質、安全性、合法性等について一切保証しません。</p>
                <p>3. 販売者は、プロンプトの内容について正確かつ詳細な説明を行う義務を負います。</p>
                <p>4. 販売者は、販売するプロンプトについて必要な権利を有していることを保証するものとします。</p>
                <p>5. 購入者と販売者間のトラブルについては、当事者間で解決するものとし、当社は責任を負いません。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第5条（決済代行・資金の流れ）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 本サービスにおける売買代金の決済は、当社が提供する決済代行サービスを通じて行われます。</p>
                <p>2. 購入者が支払った代金は、一旦当社が預かり、取引完了後に手数料を差し引いて販売者に支払います。</p>
                <p>3. 当社の決済代行サービスは、資金決済法における資金移動業及び前払式支払手段には該当しません。</p>
                <p>4. 決済処理には、Stripe Inc.の決済サービスを利用します。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第6条（手数料・料金）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 当社は、取引成立時に販売者から以下の手数料を収受します。</p>
                <div className="pl-4 space-y-1">
                  <p>• <strong>販売手数料</strong>：売上金額の10%（税込）</p>
                  <p>• <strong>決済手数料</strong>：売上金額の3.6%（税込）</p>
                </div>
                <p>2. 上記手数料は、決済完了時に売上金額から自動的に控除され、残額が販売者に支払われます。</p>
                <p>3. 決済処理にはStripe Inc.のサービスを利用し、決済手数料は同社の標準料金に準拠します。</p>
                <p>4. 手数料率は30日前の事前通知により変更する場合があります。</p>
                <p>5. 一度控除された手数料の返金は行いません。</p>
                <p>6. 販売価格及び手数料は日本円（JPY）で表示・計算されます。</p>
                <p>7. 最小販売単位は1円とし、手数料計算時の端数は切り下げとします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第7条（キャンセル・返品・返金）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. プロンプトの性質上、原則として購入後のキャンセル・返品・返金は行いません。</p>
                <p>2. 販売者の重大な説明不足や虚偽の記載があった場合、当社の判断により返金対応を行う場合があります。</p>
                <p>3. 返金を行う場合、決済手数料等の諸費用は返金対象外とします。</p>
                <p>4. 購入者は、購入前に商品説明を十分確認する責任を負います。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第8条（知的財産権）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 販売者が投稿するプロンプトの著作権は、販売者に帰属します。</p>
                <p>2. 販売者は、プロンプトの販売により、購入者に対し非独占的な利用許諾を与えるものとします。</p>
                <p>3. 購入者は、購入したプロンプトを商用利用することができますが、再販売は禁止します。</p>
                <p>4. 本サービス自体に関する知的財産権は、当社又は当社にライセンスを許諾している者に帰属します。</p>
                <p>5. ユーザーは、当社に対し、投稿コンテンツを本サービス運営に必要な範囲で利用することを許諾するものとします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第9条（禁止事項）</h2>
              <div className="space-y-3 text-gray-700">
                <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
                <div className="pl-4 space-y-1">
                  <p>• 法令、本規約又は公序良俗に違反する行為</p>
                  <p>• 犯罪行為に関連する行為又は助長する行為</p>
                  <p>• 第三者の知的財産権を侵害する行為</p>
                  <p>• 虚偽の情報を提供する行為</p>
                  <p>• マネーロンダリング、テロ資金供与に関連する行為</p>
                  <p>• 公序良俗に反するプロンプトの販売</p>
                  <p>• 違法薬物、武器等の販売を促進するプロンプトの販売</p>
                  <p>• 差別、誹謗中傷を含むコンテンツの投稿</p>
                  <p>• 本サービスの運営を妨害する行為</p>
                  <p>• 不正アクセス、ウイルス送信等のサイバー攻撃</p>
                  <p>• 当社の承諾なくAPI等を利用した自動的な情報収集</p>
                  <p>• その他当社が不適切と判断する行為</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第10条（アカウント管理・利用制限）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. ユーザーは、アカウント情報を適切に管理し、第三者による不正利用を防止する義務を負います。</p>
                <p>2. 当社は、以下の場合、事前通知なくアカウントの利用制限又は削除を行うことができます。</p>
                <div className="pl-4 space-y-1">
                  <p>• 本規約に違反した場合</p>
                  <p>• 長期間利用がない場合</p>
                  <p>• 本人確認に協力しない場合</p>
                  <p>• 反社会的勢力に該当することが判明した場合</p>
                  <p>• その他当社が不適切と判断した場合</p>
                </div>
                <p>3. アカウント削除時の残高処理については、当社の定める方法により行います。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第11条（プライバシー・個人情報）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 当社による個人情報の取扱いについては、別途定めるプライバシーポリシーによるものとします。</p>
                <p>2. 当社は、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供しません。</p>
                <p>3. 本人確認で取得した書類等は、法令に定める期間適切に保管します。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第12条（サービスの変更・停止）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 当社は、事前の通知により本サービスの内容を変更することができます。</p>
                <p>2. 当社は、以下の場合、事前通知なく本サービスを停止できます。</p>
                <div className="pl-4 space-y-1">
                  <p>• システムメンテナンスのため</p>
                  <p>• 天災等の不可抗力による場合</p>
                  <p>• 緊急の安全確保が必要な場合</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第13条（免責・損害賠償の制限）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 当社は、ユーザー間の取引に関して発生した損害について責任を負いません。</p>
                <p>2. 当社の責に帰すべき事由によりユーザーに損害が生じた場合でも、賠償額は当該ユーザーが当社に支払った手数料額を上限とします。</p>
                <p>3. 当社は、間接損害、逸失利益、精神的損害については責任を負いません。</p>
                <p>4. 本条の規定は、当社の故意又は重過失による場合には適用されません。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第14条（規約の変更）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 当社は、法令改正、サービス内容の変更等に伴い、本規約を変更することがあります。</p>
                <p>2. 規約変更の際は、効力発生日の30日前までに本サイト上で告知します。</p>
                <p>3. 変更に同意できない場合、ユーザーは効力発生日前にアカウントを削除できます。</p>
                <p>4. 効力発生日後の継続利用をもって、変更に同意したものとみなします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第15条（準拠法・管轄裁判所）</h2>
              <div className="space-y-3 text-gray-700">
                <p>1. 本規約は日本法に準拠し、日本法に従って解釈されるものとします。</p>
                <p>2. 本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">第16条（お問い合わせ）</h2>
              <div className="space-y-3 text-gray-700">
                <p>本規約に関するご質問、お困りごとは以下までお問い合わせください。</p>
                <div className="pl-4 space-y-1">
                  <p>Queue株式会社</p>
                  <p>メール: support@prompty-ai.com</p>
                  <p>受付時間: 平日10:00-18:00（土日祝日除く）</p>
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

export default Terms;

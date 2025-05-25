import React from 'react';
import Footer from '../components/footer';
import { Helmet } from 'react-helmet';

const HowToUse: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Helmet>
        <title>よくある質問・promptyの使い方 | prompty</title>
      </Helmet>
      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">よくある質問・promptyの使い方.</h1>
          
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">promptyとは？</h2>
              <p className="text-gray-700">
                promptyは、AIプロンプト共有プラットフォームです。ユーザーは自分で作成したAIプロンプトを共有したり、他のユーザーが作成したプロンプトを利用したりすることができます。
              </p>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">よくある質問</h2>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">Q: アカウントの作成は無料ですか？</h3>
                  <p className="text-gray-700">A: はい、promptyのアカウント作成は完全に無料です。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">Q: プロンプトの公開方法を教えてください</h3>
                  <p className="text-gray-700">A: アカウントにログイン後、「プロンプトを投稿」ボタンをクリックし、必要な情報を入力することで公開できます。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">Q: 有料プロンプトを購入するにはどうすればいいですか？</h3>
                  <p className="text-gray-700">A: 購入したいプロンプトのページに移動し、「購入する」ボタンをクリックしてお支払い手続きを行ってください。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">Q: promptyプレミアムの特典は何ですか？</h3>
                  <p className="text-gray-700">A: プレミアム会員になると、限定プロンプトへのアクセス、月額ポイント付与、広告非表示などの特典があります。</p>
                </div>
              </div>
            </section>
            
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">使い方ガイド</h2>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">1. アカウント作成</h3>
                  <p className="text-gray-700">ホームページ右上の「会員登録」ボタンをクリックし、必要情報を入力してアカウントを作成します。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">2. プロンプトを探す</h3>
                  <p className="text-gray-700">ホームページのカテゴリーから興味のあるプロンプトを探すか、検索機能を使って特定のプロンプトを見つけることができます。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">3. プロンプトを利用する</h3>
                  <p className="text-gray-700">気に入ったプロンプトを見つけたら、そのまま無料プロンプトを利用するか、有料プロンプトを購入して利用できます。</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-2">4. プロンプトを投稿する</h3>
                  <p className="text-gray-700">自分で作成したプロンプトを共有したい場合は、「プロンプトを投稿」から必要情報を入力し、無料または有料で公開できます。</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowToUse;

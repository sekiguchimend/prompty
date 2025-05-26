import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Check } from 'lucide-react';
import Footer from '../components/footer';
const Premium = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden header-spacing">
      {/* 背景イラスト（透かし） */}
      <div className="absolute inset-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
        <div className="relative w-full h-full">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {["📝", "👍", "💡", "🎈", "🌟", "📚", "💬", "🔍", "📆", "📊", "🛠️", "📱"][
                Math.floor(Math.random() * 12)
              ]}
            </div>
          ))}
        </div>
      </div>

      {/* ヘッダー */}
      
      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <h1 className="text-lg mb-3 text-gray-800">
          もっとpromptyが楽しくなる
        </h1>
        <h2 className="text-4xl font-bold mb-2">
          promptyプレミアム
        </h2>
        <p className="text-gray-500 mb-6">
          (月額500円)
        </p>

        <Button 
          className="w-full max-w-sm mx-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-3 mb-2"
        >
          promptyプレミアムに申し込む
        </Button>
        <p className="text-xs text-gray-500 mb-16">
          加入月は無料でお試しできます！
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-8">promptyプレミアムとは</h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
            クリエイターの表現活動に、予約投稿や定期購読などより便利な機能を加えました。
            文章編集「便箋あり」でもっと美しくてすっきりした見栄えに、機能を追加しました。
            今後も、noteがより楽しくなる機能を追加していきます。ぜひお試しを！
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
          {/* 定期購読マガジンの申し込み */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                  <path d="M8 18h8" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">定期購読マガジンの申し込み</h4>
              <p className="text-xs text-gray-600 mb-2">月額制でお気に入りのマガジンを定期購読できます。月々のクレジットカード決済で、自動的に更新されます。</p>
              <a href="#" className="text-xs text-gray-500 underline">定期購読マガジンについて</a>
            </div>
          </div>

          {/* 共同運営マガジン機能 */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">共同運営マガジン機能</h4>
              <p className="text-xs text-gray-600 mb-2">複数のクリエイターでひとつのマガジンを運営できます。クリエイターごとに編集権限を設定できます。</p>
              <a href="#" className="text-xs text-gray-500 underline">共同運営マガジンについて</a>
            </div>
          </div>

          {/* 予約投稿機能 */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">予約投稿機能</h4>
              <p className="text-xs text-gray-600">予約日時を指定して、記事を予約投稿することができます。</p>
            </div>
          </div>

          {/* つくれるマガジン数UP */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                  <path d="M12 11v6" />
                  <path d="M9 14h6" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">つくれるマガジン数UP</h4>
              <p className="text-xs text-gray-600">プレミアムでは最大10個のマガジンを作成・管理できます。</p>
            </div>
          </div>

          {/* コメント欄のON/OFF機能 */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 9h8" />
                  <path d="M8 13h6" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">コメント欄のON/OFF機能</h4>
              <p className="text-xs text-gray-600">記事ごとにコメント欄のON/OFFを設定することができます。</p>
            </div>
          </div>

          {/* 数量限定販売 */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M8 11h.01" />
                  <path d="M12 11h.01" />
                  <path d="M16 11h.01" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">数量限定販売</h4>
              <p className="text-xs text-gray-600">販売数を制限することができます。100,000枚まで設定可能です。</p>
            </div>
          </div>

          {/* Amazonウィジェット */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M12 12h.01" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">Amazonウィジェット</h4>
              <p className="text-xs text-gray-600">クリエイターがIDを取得するとAmazonウィジェットを設置することができます。YouTubeの埋め込みも可能です！</p>
            </div>
          </div>

          {/* YouTube動画表示 */}
          <div className="flex">
            <div className="flex-shrink-0 mr-4">
              <div className="w-20 h-20 bg-red-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <path d="m10 12 5-3-5-3v6Z" />
                </svg>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-1">YouTube動画表示</h4>
              <p className="text-xs text-gray-600">プレミアムユーザーはYouTube動画を表示することができます。Amazonウィジェットも使用可能です！</p>
            </div>
          </div>
        </div>

        <Button 
          className="w-full max-w-sm mx-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-3 mb-2"
        >
          promptyプレミアムに申し込む
        </Button>
        <p className="text-xs text-gray-500 mb-16">
          加入月は無料でお試しできます！
        </p>

        <section className="mb-12">
          <h3 className="text-xl font-bold mb-8">promptyプレミアム機能比較表</h3>
          
          <div className="w-full max-w-3xl mx-auto border-t border-gray-200">
            <div className="grid grid-cols-3 text-sm py-3 border-b">
              <div className="text-left font-medium">機能</div>
              <div className="text-center">無料会員</div>
              <div className="text-center">プレミアム</div>
            </div>

            {[
              "定期購読マガジンの申し込み",
              "共同運営マガジン機能",
              "予約投稿機能",
              "つくれるマガジン数UP",
              "コメント欄のON/OFF機能",
              "数量限定販売",
              "Amazonウィジェット",
              "YouTube動画表示"
            ].map((feature, index) => (
              <div key={index} className="grid grid-cols-3 text-sm py-4 border-b">
                <div className="text-left">{feature}</div>
                <div className="text-center text-gray-400">-</div>
                <div className="text-center text-emerald-500 flex justify-center">
                  <Check size={18} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-12">
          <p className="text-center text-sm font-bold mb-2">その他にも、便利な機能が続々追加予定！</p>
          <p className="text-xs text-gray-500">
            ※ noteプレミアムの機能追加は、随時ユーザーフィードバックを取り入れながら行います。今後、予告なしに仕様変更することがあります。
          </p>
        </div>

        <div className="mb-8">
          <Button 
            className="w-full max-w-sm mx-auto bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-3 mb-2"
          >
            promptyプレミアムに申し込む
          </Button>
          <p className="text-xs text-gray-500">
            加入月は無料でお試しできます！
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Premium; 

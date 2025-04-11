
import React from 'react';
import { Separator } from './ui/separator';

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-200 py-8 bg-white">
      <div className="container flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-gray-500">
        <a href="/premium" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          promptyプレミアム
        </a>
        <a href="/pro" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          prompty pro
        </a>
        <a href="/how-to-use" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          よくある質問・promptyの使い方
        </a>
        <a href="/privacy" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          プライバシー
        </a>
        <a href="/feedback" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          フィードバック
        </a>
        <a href="/terms" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          ご利用規約
        </a>
        <a href="/points-terms" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          通常ポイント利用特約
        </a>
        <a href="/merchant-terms" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          加盟店規約
        </a>
        <a href="/payment-disclosure" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          資金決済法に基づく表示
        </a>
        <a href="/commercial-transaction" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          特商法表記
        </a>
        <a href="/investment-disclaimer" className="hover:text-gray-900 hover:underline whitespace-nowrap">
          投資情報の免責事項
        </a>
      </div>
    </footer>
  );
};

export default Footer;
